import fetch from 'node-fetch';
import { GithubIntegration } from '../models/integration.model.js';
import { Octokit } from '@octokit/rest';
import { ingestWorkspaceFile } from './workspaceIngestion.service.js';

export async function getGithubStatus(projectId) {
  const integration = await GithubIntegration.findOne({ projectId, isActive: true });
  if (!integration) {
    return { connected: false };
  }
  return {
    connected: true,
    username: integration.username,
    lastSync: integration.lastSyncTimestamp
  };
}

export async function connectGithub({ projectId, userId, code }) {
  const clientId = process.env.ClLIENT_ID || process.env.CLIENT_ID;
  const clientSecret = process.env.CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('GitHub Client ID or Secret not configured on server');
  }

  // 1. Exchange code for access token
  const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code
    })
  });

  const tokenData = await tokenResponse.json();

  if (tokenData.error) {
    throw new Error(`GitHub auth failed: ${tokenData.error_description || tokenData.error}`);
  }

  const accessToken = tokenData.access_token;
  if (!accessToken) {
    throw new Error('Failed to retrieve access token from GitHub');
  }

  // 2. Fetch user profile to get username
  const octokit = new Octokit({ auth: accessToken });
  const { data: user } = await octokit.rest.users.getAuthenticated();

  // 3. Save to DB
  let integration = await GithubIntegration.findOne({ projectId });
  if (integration) {
    integration.accessToken = accessToken;
    integration.username = user.login;
    integration.isActive = true;
    integration.createdBy = userId;
    await integration.save();
  } else {
    integration = await GithubIntegration.create({
      projectId,
      createdBy: userId,
      accessToken,
      username: user.login,
      isActive: true
    });
  }

  return {
    username: user.login
  };
}

export async function disconnectGithub(projectId) {
  await GithubIntegration.findOneAndUpdate(
    { projectId },
    { $set: { isActive: false, accessToken: '' } }
  );
  return true;
}

// Helper to get authenticated octokit instance
async function getOctokitForProject(projectId) {
  const integration = await GithubIntegration.findOne({ projectId, isActive: true }).select('+accessToken');
  if (!integration || !integration.accessToken) {
    throw new Error('GitHub integration not connected or token missing');
  }
  return new Octokit({ auth: integration.accessToken });
}

export async function getRepos(projectId) {
  const octokit = await getOctokitForProject(projectId);
  // Fetch user's repos (including private if scope allows)
  const { data } = await octokit.rest.repos.listForAuthenticatedUser({
    sort: 'updated',
    per_page: 50
  });
  return data.map(repo => ({
    id: repo.id,
    name: repo.name,
    full_name: repo.full_name,
    private: repo.private,
    html_url: repo.html_url,
    description: repo.description,
    updated_at: repo.updated_at
  }));
}

export async function getRepoContents(projectId, owner, repo, path = '') {
  const octokit = await getOctokitForProject(projectId);
  const { data } = await octokit.rest.repos.getContent({
    owner,
    repo,
    path
  });
  return data;
}

export async function getCommits(projectId, owner, repo) {
  const octokit = await getOctokitForProject(projectId);
  const { data } = await octokit.rest.repos.listCommits({
    owner,
    repo,
    per_page: 30
  });
  return data.map(c => ({
    sha: c.sha,
    message: c.commit.message,
    author: c.commit.author?.name || c.author?.login,
    date: c.commit.author?.date,
    html_url: c.html_url
  }));
}

export async function getPullRequests(projectId, owner, repo) {
  const octokit = await getOctokitForProject(projectId);
  const { data } = await octokit.rest.pulls.list({
    owner,
    repo,
    state: 'all',
    sort: 'updated',
    direction: 'desc',
    per_page: 20
  });
  return data.map(pr => ({
    number: pr.number,
    title: pr.title,
    state: pr.state,
    user: pr.user.login,
    created_at: pr.created_at,
    updated_at: pr.updated_at,
    html_url: pr.html_url
  }));
}

export async function getRepoTree(projectId, owner, repo) {
  const octokit = await getOctokitForProject(projectId);
  
  const { data: repoData } = await octokit.rest.repos.get({ owner, repo });
  const defaultBranch = repoData.default_branch || 'main';

  const { data: treeData } = await octokit.rest.git.getTree({
    owner,
    repo,
    tree_sha: defaultBranch,
    recursive: "1"
  });

  return treeData.tree;
}

export async function syncGithubRepo(projectId, owner, repo, userId) {
  const octokit = await getOctokitForProject(projectId);
  
  // 1. Get tree
  const tree = await getRepoTree(projectId, owner, repo);
  
  // 2. Filter files (only code files, ignore images/binaries/large files)
  const allowedExtensions = ['js','jsx','ts','tsx','py','java','cpp','c','cs','rb','go','rs','php','swift','kt','html','css','json','md','sql','sh'];
  const codeFiles = tree.filter(node => {
    if (node.type !== 'blob') return false;
    const ext = node.path.split('.').pop().toLowerCase();
    return allowedExtensions.includes(ext);
  });

  // Limit to max 50 files for demonstration purposes to avoid long delays
  const filesToSync = codeFiles.slice(0, 50);

  let syncedFiles = 0;
  for (const file of filesToSync) {
    try {
      const { data } = await octokit.rest.repos.getContent({
        owner,
        repo,
        path: file.path
      });
      
      if (data.content && data.encoding === 'base64') {
        const fileContent = Buffer.from(data.content, 'base64');
        await ingestWorkspaceFile({
          fileBuffer: fileContent,
          fileName: `[${repo}] ${file.path}`,
          projectId,
          userId
        });
        syncedFiles++;
      }
    } catch (err) {
      console.error(`Error syncing file ${file.path}:`, err.message);
    }
  }

  return { syncedFiles, totalCodeFiles: codeFiles.length };
}

