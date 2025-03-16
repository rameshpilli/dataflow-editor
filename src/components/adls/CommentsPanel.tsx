
import React, { useState } from 'react';
import { Comment } from '@/types/adls';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { Check, MessageCircle, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface CommentsPanelProps {
  comments: Comment[];
  onAddComment: (text: string, rowId?: string, columnName?: string) => void;
  onResolveComment: (commentId: string) => void;
  selectedRowId?: string;
  selectedColumnName?: string;
}

const CommentsPanel: React.FC<CommentsPanelProps> = ({
  comments,
  onAddComment,
  onResolveComment,
  selectedRowId,
  selectedColumnName,
}) => {
  const [newComment, setNewComment] = useState('');
  const { user } = useAuth();
  const [filter, setFilter] = useState<'all' | 'active' | 'resolved'>('active');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newComment.trim()) {
      onAddComment(newComment, selectedRowId, selectedColumnName);
      setNewComment('');
    }
  };

  const filteredComments = comments.filter(comment => {
    if (filter === 'all') return true;
    return filter === 'active' ? !comment.resolved : comment.resolved;
  });

  const getCommentTarget = (comment: Comment) => {
    if (comment.rowId && comment.columnName) {
      return `Row ${comment.rowId.replace('row_', '')} - ${comment.columnName}`;
    } else if (comment.rowId) {
      return `Row ${comment.rowId.replace('row_', '')}`;
    } else if (comment.columnName) {
      return `Column ${comment.columnName}`;
    }
    return 'Dataset';
  };

  return (
    <div className="flex flex-col h-full border rounded-md bg-background">
      <div className="p-4 border-b flex justify-between items-center">
        <div className="flex items-center">
          <MessageCircle className="w-5 h-5 mr-2" />
          <h3 className="text-lg font-medium">Comments</h3>
        </div>
        <div className="flex space-x-2">
          <Button 
            variant={filter === 'all' ? "default" : "outline"} 
            size="sm" 
            onClick={() => setFilter('all')}
          >
            All
          </Button>
          <Button 
            variant={filter === 'active' ? "default" : "outline"} 
            size="sm" 
            onClick={() => setFilter('active')}
          >
            Active
          </Button>
          <Button 
            variant={filter === 'resolved' ? "default" : "outline"} 
            size="sm" 
            onClick={() => setFilter('resolved')}
          >
            Resolved
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1 p-4">
        {filteredComments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No {filter} comments
          </div>
        ) : (
          <div className="space-y-4">
            {filteredComments.map(comment => (
              <div key={comment.id} className={`p-3 rounded-md border ${comment.resolved ? 'bg-muted/30' : 'bg-background'}`}>
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="font-medium">{comment.createdBy}</div>
                    <div className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                    </div>
                  </div>
                  {!comment.resolved && (
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={() => onResolveComment(comment.id)}
                      className="h-7 px-2"
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Resolve
                    </Button>
                  )}
                </div>
                
                <div className="text-xs font-medium text-muted-foreground mb-1">
                  {getCommentTarget(comment)}
                </div>
                
                <div className="text-sm">{comment.text}</div>
                
                {comment.resolved && (
                  <div className="mt-2 text-xs text-muted-foreground flex items-center">
                    <Check className="h-3 w-3 mr-1" />
                    Resolved by {comment.resolvedBy} {comment.resolvedAt && 
                      formatDistanceToNow(new Date(comment.resolvedAt), { addSuffix: true })}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      <Separator />
      
      <form onSubmit={handleSubmit} className="p-4">
        <Textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Add a comment..."
          className="mb-2 min-h-[100px]"
        />
        <div className="flex justify-between items-center">
          <div className="text-xs text-muted-foreground">
            {selectedRowId || selectedColumnName ? (
              <>Commenting on: {selectedRowId ? `Row ${selectedRowId.replace('row_', '')}` : ''} 
              {selectedRowId && selectedColumnName ? ' - ' : ''}
              {selectedColumnName || ''}</>
            ) : (
              'Commenting on entire dataset'
            )}
          </div>
          <Button type="submit" disabled={!newComment.trim()}>
            Add Comment
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CommentsPanel;
