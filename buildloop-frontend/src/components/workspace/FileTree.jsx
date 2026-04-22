import React, { useState, useMemo } from 'react';
import { ChevronRight, ChevronDown, Folder, File as FileIcon, FileCode, FileText, Image as ImageIcon } from 'lucide-react';

const getFileIcon = (filename) => {
  const ext = filename.split('.').pop().toLowerCase();
  if (['js', 'jsx', 'ts', 'tsx', 'css', 'json', 'html'].includes(ext)) {
    return <FileCode className="w-4 h-4 text-blue-400" />;
  }
  if (['md', 'txt'].includes(ext)) {
    return <FileText className="w-4 h-4 text-gray-400" />;
  }
  if (['png', 'jpg', 'jpeg', 'svg', 'gif'].includes(ext)) {
    return <ImageIcon className="w-4 h-4 text-purple-400" />;
  }
  return <FileIcon className="w-4 h-4 text-gray-400" />;
};

const TreeNode = ({ node, level = 0, onFileClick, repoUrl }) => {
  const [isOpen, setIsOpen] = useState(level === 0);
  const isDir = node.type === 'tree';

  const handleClick = (e) => {
    e.stopPropagation();
    if (isDir) {
      setIsOpen(!isOpen);
    } else {
      if (onFileClick) {
        onFileClick(node);
      } else {
        window.open(`${repoUrl}/blob/main/${node.path}`, '_blank');
      }
    }
  };

  return (
    <div className="w-full">
      <div 
        onClick={handleClick}
        className={`flex items-center gap-1.5 py-1 px-2 hover:bg-gray-50 rounded-md cursor-pointer transition-colors group text-sm ${isDir ? 'text-gray-800 font-medium' : 'text-gray-600 hover:text-gray-900'}`}
        style={{ paddingLeft: `${level * 12 + 8}px` }}
      >
        <div className="w-4 h-4 flex items-center justify-center shrink-0">
          {isDir ? (
            <div className="text-gray-400 group-hover:text-gray-600 transition-colors">
              {isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            </div>
          ) : (
            <div className="w-3.5" /> // spacer for files
          )}
        </div>
        
        <div className="flex items-center gap-2 flex-1 truncate">
          {isDir ? (
            <Folder className={`w-4 h-4 ${isOpen ? 'text-blue-500' : 'text-blue-400'}`} />
          ) : (
            getFileIcon(node.name)
          )}
          <span className="truncate">{node.name}</span>
        </div>
      </div>
      
      {isDir && isOpen && node.children && (
        <div className="flex flex-col w-full">
          {Object.values(node.children)
            .sort((a, b) => {
              if (a.type === b.type) return a.name.localeCompare(b.name);
              return a.type === 'tree' ? -1 : 1;
            })
            .map((childNode) => (
              <TreeNode 
                key={childNode.path} 
                node={childNode} 
                level={level + 1} 
                onFileClick={onFileClick}
                repoUrl={repoUrl}
              />
            ))
          }
        </div>
      )}
    </div>
  );
};

export default function FileTree({ data, repoUrl, onFileClick }) {
  const tree = useMemo(() => {
    if (!data || !Array.isArray(data)) return null;
    
    const root = { children: {} };
    data.forEach(item => {
      const parts = item.path.split('/');
      let current = root;
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        if (!current.children[part]) {
          current.children[part] = {
            name: part,
            path: parts.slice(0, i + 1).join('/'),
            type: i === parts.length - 1 ? item.type : 'tree',
            children: {}
          };
        }
        current = current.children[part];
      }
      Object.assign(current, item);
    });
    
    return root.children;
  }, [data]);

  if (!tree) return null;

  return (
    <div className="flex flex-col w-full py-2 bg-white overflow-hidden">
      {Object.values(tree)
        .sort((a, b) => {
          if (a.type === b.type) return a.name.localeCompare(b.name);
          return a.type === 'tree' ? -1 : 1; // folders first
        })
        .map((node) => (
          <TreeNode 
            key={node.path} 
            node={node} 
            repoUrl={repoUrl} 
            onFileClick={onFileClick} 
          />
        ))}
    </div>
  );
}
