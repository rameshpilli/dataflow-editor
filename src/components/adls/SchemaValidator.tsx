
import React, { useState } from 'react';
import { DatasetColumn, ValidationError, ValidationResult } from '@/types/adls';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Shield, AlertTriangle } from 'lucide-react';

interface SchemaValidatorProps {
  column: DatasetColumn;
  onSave: (updatedColumn: DatasetColumn) => void;
  onCancel: () => void;
}

const SchemaValidator: React.FC<SchemaValidatorProps> = ({ column, onSave, onCancel }) => {
  const [validation, setValidation] = useState(column.validation || {});
  
  const handleChange = (field: string, value: any) => {
    setValidation(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = () => {
    onSave({
      ...column,
      validation: validation
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Schema Validation Rules</h3>
          <p className="text-sm text-muted-foreground">
            For column: <span className="font-medium">{column.name}</span> ({column.type})
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Shield className="h-5 w-5 text-blue-500" />
        </div>
      </div>

      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="basic">Basic Rules</TabsTrigger>
          <TabsTrigger value="advanced">Advanced Rules</TabsTrigger>
        </TabsList>
        
        <TabsContent value="basic" className="space-y-4 mt-4">
          <div className="flex items-center space-x-2">
            <Switch 
              id="required" 
              checked={validation.required || false}
              onCheckedChange={(checked) => handleChange('required', checked)}
            />
            <Label htmlFor="required">Required field (cannot be null)</Label>
          </div>
          
          {(column.type === 'string') && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="minLength">Minimum Length</Label>
                  <Input 
                    id="minLength"
                    type="number"
                    value={validation.minLength || ''}
                    onChange={(e) => handleChange('minLength', e.target.value ? Number(e.target.value) : undefined)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxLength">Maximum Length</Label>
                  <Input 
                    id="maxLength"
                    type="number"
                    value={validation.maxLength || ''}
                    onChange={(e) => handleChange('maxLength', e.target.value ? Number(e.target.value) : undefined)}
                  />
                </div>
              </div>
            </>
          )}
          
          {(column.type === 'integer' || column.type === 'decimal') && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="minValue">Minimum Value</Label>
                <Input 
                  id="minValue"
                  type="number"
                  value={validation.minValue || ''}
                  onChange={(e) => handleChange('minValue', e.target.value ? Number(e.target.value) : undefined)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxValue">Maximum Value</Label>
                <Input 
                  id="maxValue"
                  type="number"
                  value={validation.maxValue || ''}
                  onChange={(e) => handleChange('maxValue', e.target.value ? Number(e.target.value) : undefined)}
                />
              </div>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="advanced" className="space-y-4 mt-4">
          {(column.type === 'string') && (
            <div className="space-y-2">
              <Label htmlFor="pattern">Regex Pattern</Label>
              <Input 
                id="pattern"
                type="text"
                value={validation.pattern || ''}
                onChange={(e) => handleChange('pattern', e.target.value || undefined)}
                placeholder="e.g. ^[A-Z]{2}[0-9]{4}$"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Use regular expressions to validate text format
              </p>
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="enum">Allowed Values (comma separated)</Label>
            <Input 
              id="enum"
              type="text"
              value={validation.enum ? validation.enum.join(', ') : ''}
              onChange={(e) => {
                const values = e.target.value.split(',').map(v => v.trim()).filter(Boolean);
                handleChange('enum', values.length > 0 ? values : undefined);
              }}
              placeholder="e.g. Option1, Option2, Option3"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Restrict to specific values only
            </p>
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end space-x-2 pt-4">
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button onClick={handleSave}>Save Validation Rules</Button>
      </div>
    </div>
  );
};

// Validation Results Dialog Component
export const ValidationResultsDialog: React.FC<{
  validationResult: ValidationResult | null;
  isOpen: boolean;
  onClose: () => void;
}> = ({ validationResult, isOpen, onClose }) => {
  if (!validationResult) return null;
  
  const errorCount = validationResult.errors.filter(e => e.severity === 'error').length;
  const warningCount = validationResult.errors.filter(e => e.severity === 'warning').length;
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Shield className="h-5 w-5 mr-2" /> 
            Schema Validation Results
          </DialogTitle>
          <DialogDescription>
            {validationResult.isValid ? 
              'All data passed validation successfully.' : 
              `Found ${errorCount} errors and ${warningCount} warnings in your data.`}
          </DialogDescription>
        </DialogHeader>
        
        {!validationResult.isValid && validationResult.errors.length > 0 && (
          <ScrollArea className="max-h-[60vh] mt-4">
            <div className="space-y-2">
              {validationResult.errors.map((error, index) => (
                <Card key={index} className={error.severity === 'error' ? 'border-red-200' : 'border-yellow-200'}>
                  <CardHeader className="py-2 px-4">
                    <div className="flex items-center">
                      <AlertTriangle className={`h-4 w-4 mr-2 ${error.severity === 'error' ? 'text-red-500' : 'text-yellow-500'}`} />
                      <CardTitle className="text-sm font-medium">Row {error.rowId.replace('row_', '')} - {error.columnName}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="py-2 px-4">
                    <p className="text-sm">{error.message}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        )}
        
        <DialogFooter>
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SchemaValidator;
