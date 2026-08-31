import useTreeGeometry from "../../useTreeGeometry";

import "./AzureTree.css";

/*
 * The real, code-true structure of the one Azure OpenAI
 * resource this app calls (see server/Services/Azure/
 * OpenAIResponses.js): no Project, no Agent object —
 * `createResponse()` and `getContainerFileContent()` both
 * hit the same resource, just different REST paths on it.
 * Model Deployments are the actual env-configured Azure
 * objects; Containers are the stateless file-retrieval
 * surface, tied to whichever response created the files,
 * not to any deployment. Four equal-width spots, grouped
 * 3-and-1 with a labeled border around each group — the
 * same pattern the Mongo tree uses for its own collection
 * groups.
 *
 * Router/Analyst/Maintenance/Worker are deliberately NOT
 * here: they're prompt-level configuration, not a separate
 * Azure structural entity — that diagram is kept elsewhere
 * on this page for later, once agent/prompt logic gets its
 * own treatment.
 */
function AzureItem({ id, label, registerBox }) {
  return (
    <div ref={registerBox(id)} className="sysdiag-azure-item">
      {label}
    </div>
  );
}

function AzureGroup({ title, flexShare, children }) {
  return (
    <div className="sysdiag-azure-group" style={{ flex: flexShare }}>
      <div className="sysdiag-azure-group-title">{title}</div>
      <div className="sysdiag-azure-group-items">{children}</div>
    </div>
  );
}

function AzureTree({ onGeometryChange }) {
  const { contentRef, registerBox } = useTreeGeometry(onGeometryChange);

  return (
    <div ref={contentRef} className="sysdiag-azure-tree">
      <div className="sysdiag-azure-label">AZURE OPENAI</div>

      <div className="sysdiag-azure-row">
        <AzureGroup title="Model Deployments" flexShare={3}>
          <AzureItem id="deployment-gpt-56-terra" label="gpt-5.6-terra" registerBox={registerBox} />
          <AzureItem id="deployment-gpt-53-codex" label="gpt-5.3-codex" registerBox={registerBox} />
          <AzureItem id="deployment-gpt-image-2" label="gpt-image-2" registerBox={registerBox} />
        </AzureGroup>

        <AzureGroup title="Containers" flexShare={1}>
          <AzureItem id="containers-file-retrieval" label="file retrieval" registerBox={registerBox} />
        </AzureGroup>
      </div>
    </div>
  );
}

export default AzureTree;
