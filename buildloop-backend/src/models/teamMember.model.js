import mongoose from 'mongoose';

const teamMemberSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    role: {
      type: String,
      required: true,
      trim: true,
      default: 'Developer',
    },
    /** Clerk userId of the PM who added this member */
    addedBy: {
      type: String,
      required: true,
    },
    /** The project this member has been assigned to */
    projectId: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      trim: true,
      default: '',
    },
  },
  { timestamps: true }
);

// Unique: one email per project (a person can be added to multiple projects, but not twice to the same)
teamMemberSchema.index({ email: 1, projectId: 1 }, { unique: true });

export const TeamMember = mongoose.model(
  'TeamMember',
  teamMemberSchema,
  process.env.COLLECTION_TEAM_MEMBERS || 'teamMembers'
);
