import { END, START, StateGraph, Annotation, messagesStateReducer } from "@langchain/langgraph/web";
import pg from "pg";
import { BaseMessage, HumanMessage } from "@langchain/core/messages";
import { PostgresSaver } from "@langchain/langgraph-checkpoint-postgres";
import { llm } from './model';
import { toolNode } from './tools';


const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
});
const checkpointer = new PostgresSaver(pool);

// NOTE: you need to call .setup() the first time you're using your checkpointer
// Later calls to .setup() are no-ops.
await checkpointer.setup();

const GraphAnnotation = Annotation.Root({
  messagesStateReducer,
  bidderID,
  auctionID,
  bidAmount,
});

function nodeA(state: typeof GraphAnnotation.State) {
  return ;
}

const workflow = new StateGraph(GraphAnnotation);
  .addNode("nodeA", nodeA)
  .addNode("tools", toolNode)
  .addEdge(START, "nodeA")
  .addEdge("nodeA", "nodeB")
  .addEdge("nodeB", END);

const graph = workflow.compile({ checkpointer });




