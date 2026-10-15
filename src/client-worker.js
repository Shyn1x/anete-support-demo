// Client deployments do not export or create their own budget namespace.
// GUARD binds to BudgetGuard in the existing owner Worker.
import {createWorker} from './worker.js';
export default createWorker();
