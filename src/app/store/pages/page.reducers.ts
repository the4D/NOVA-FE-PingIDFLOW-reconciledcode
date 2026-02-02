import { createReducer } from "@ngrx/store";
import { InitialPageState } from "./page.state";

export const pageReducer = createReducer(InitialPageState)