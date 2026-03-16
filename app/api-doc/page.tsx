import { getApiDocs } from "../../lib/swagger";
import ReactSwagger from "./react-swagger";

export default async function ApiDocPage() {
  const spec = await getApiDocs();
  return (
    <div data-theme="light" style={{ background: "#ffffff" }}>
      <ReactSwagger spec={spec as Record<string, unknown>} />
    </div>
  );
}
