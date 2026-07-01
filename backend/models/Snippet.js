import mongoose from 'mongoose';

const snippetSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters'],
    index: true,
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters'],
    default: ['String'],
    default: '',
  },
  code: {
    type: String,
    required: [true, 'Code is required'],
    maxlength: [50000, 'Code cannot exceed 50000 characters'],
  },
  snippetLanguage: {
    type: String,
    required: [true, 'Language is required'],
    enum: [
      'JavaScript', 'TypeScript', 'Python', 'Java', 'C', 'C++',
      'C#', 'Go', 'Rust', 'Ruby', 'PHP', 'Swift', 'Kotlin',
      'HTML', 'CSS', 'SCSS', 'SQL', 'JSON', 'YAML', 'XML',
      'Markdown', 'Shell', 'Dockerfile', 'GraphQL', 'R', 'MATLAB',
    ],
    default: 'JavaScript',
    index: true,
  },
  tags: [{
    type: [String],
    trim: true,
    lowercase: true,
    maxlength: [30, 'Tag cannot exceed 30 characters'],
    index: true,
  }],
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    default: null,
  },
  projectName: {
    type: String,
    default: '',
  },
  isFavorite: {
    type: Boolean,
    default: false,
    index: true,
  },
  viewCount: {
    type: Number,
    default: 0,
    min: 0,
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Text index for search functionality
snippetSchema.index({
  title: 'text',
  description: 'text',
  code: 'text',
  tags: 'text',
});

// Compound indexes for efficient queries
snippetSchema.index({ snippetLanguage: 1, createdAt: -1 });
snippetSchema.index({ isFavorite: 1, createdAt: -1 });
snippetSchema.index({ tags: 1 });

// Static method to search snippets
snippetSchema.statics.search = async function(query, options = {}) {
  const { snippetLanguage, tags, isFavorite, limit = 20, skip = 0 } = options;

  const filter = {};

  if (query) {
    filter.$text = { $search: query };
  }

  if (snippetLanguage) {
    filter.snippetLanguage = snippetLanguage;
  }

  if (tags && tags.length > 0) {
    filter.tags = { $all: tags };
  }

  if (isFavorite !== undefined) {
    filter.isFavorite = isFavorite;
  }

  return this.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
};

// Static method to get all unique tags
snippetSchema.statics.getAllTags = async function() {
  return this.aggregate([
    { $unwind: '$tags' },
    { $group: { _id: '$tags', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $project: { tag: '$_id', count: 1, _id: 0 } },
  ]);
};

// Static method to get language statistics
snippetSchema.statics.getLanguageStats = async function() {
  return this.aggregate([
    {
      $group: {
        _id: '$snippetLanguage',
        count: { $sum: 1 },
      },
    },
    { $sort: { count: -1 } },
  ]);
};

export default mongoose.model('Snippet', snippetSchema);
