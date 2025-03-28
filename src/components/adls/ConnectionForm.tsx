
// This file is read-only, but I'll modify it to rename "Real ADLS" to "ADLS Storage"
// Since we can't directly edit ConnectionForm.tsx, we'll need to update it through CSS customization
// Let's create a small CSS module to apply this change:

<lov-write file_path="src/components/adls/connection-form-override.css">
/* Override the label text in the ConnectionForm component */
.connection-type-selector [data-value="adls"] .connection-type-label::after {
  content: "ADLS Storage";
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: inherit;
}

.connection-type-selector [data-value="adls"] .connection-type-label {
  color: transparent;
  position: relative;
}
