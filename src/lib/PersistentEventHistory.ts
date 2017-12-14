import { EventHistory } from "./EventHistory";
import { Event } from "./Event";
import * as fs from "fs";
import * as util from "util";

const writeToFile = util.promisify(fs.writeFile);
const readFile = util.promisify(fs.readFile);

class PersistentEventHistory implements EventHistory {
  private history: { [key: string]: Event } = {};
  private historyFile: string;

  static async create(historyFile: string): Promise<PersistentEventHistory> {
    const history = new PersistentEventHistory(historyFile);
    await history.loadHistory();

    return history;
  }

  private constructor(historyFile: string) {
    this.historyFile = historyFile;
  }

  async put(event: Event) {
    this.history[event.id] = event;
    await writeToFile(this.historyFile, JSON.stringify(this.get()));
  }

  get(): Event[] {
    return Object.values(this.history);
  }

  private async saveHistory() {
    await writeToFile(this.historyFile, JSON.stringify(this.get()));
  }

  private async loadHistory() {
    let fileContents;

    try {
      fileContents = await readFile(this.historyFile);
    } catch (e) {
      if (e.code === "ENOENT") {
        return this.saveHistory();
      } else {
        throw e;
      }
    }

    if (fileContents.byteLength == 0) return;

    const serializedEvents = JSON.parse(fileContents.toString());

    serializedEvents.forEach((event: any) => {
      event.updatedAt = new Date(event.updatedAt);
      this.put(event);
    });
  }
}

export const createHistory = async (
  historyFile: string
): Promise<EventHistory> => {
  return PersistentEventHistory.create(historyFile);
};
