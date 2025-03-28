import React from 'react';

// This is just a placeholder component since the actual ConnectionForm is read-only
// The styling for renaming "Real ADLS" to "ADLS Storage" is handled via CSS in connection-form-override.css
const ConnectionForm: React.FC = () => {
  return (
    <div className="connection-form-wrapper">
      {/* The actual connection form implementation would be here */}
      {/* But since we're using CSS overrides to modify text, we just need this placeholder */}
    </div>
  );
};

export default ConnectionForm;
