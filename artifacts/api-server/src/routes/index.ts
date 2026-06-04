import { Router, type IRouter } from "express";
import healthRouter from "./health";
import playersRouter from "./players";
import teamsRouter from "./teams";
import bettingAuthRouter from "./betting-auth";
import bettingTransactionsRouter from "./betting-transactions";
import bettingMatchesRouter from "./betting-matches";

const router: IRouter = Router();

router.use(healthRouter);
router.use(playersRouter);
router.use(teamsRouter);
router.use(bettingAuthRouter);
router.use(bettingTransactionsRouter);
router.use(bettingMatchesRouter);

export default router;
