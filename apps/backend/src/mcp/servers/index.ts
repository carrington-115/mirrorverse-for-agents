import { serverHost } from "../server-host";
import { canvasServer } from "./canvas";
import { knowledgeServer } from "./knowledge";
import { scheduleServer } from "./schedule";
import { vaultServer } from "./vault";
import { workflowServer } from "./workflow";

serverHost.register(vaultServer);
serverHost.register(workflowServer);
serverHost.register(scheduleServer);
serverHost.register(canvasServer);
serverHost.register(knowledgeServer);
