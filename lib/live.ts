import * as Reconciler from "react-reconciler";
import * as WebSocket from "ws";

const CREATE_INSTANCE = "CREATE_INSTANCE";
const CREATE_TEXT_INSTANCE = "CREATE_TEXT_INSTANCE";
const APPEND_INITIAL_CHILD = "APPEND_INITIAL_CHILD";
const APPEND_CHILD_TO_CONTAINER = "APPEND_CHILD_TO_CONTAINER";
const COMMIT_TEXT_UPDATE = "COMMIT_TEXT_UPDATE";

const EVENT = "EVENT";

function send(ws: WebSocket, data: any) {
  ws.send(JSON.stringify(data));
}

type Context = {
  createId: () => number;
  registerEvent: (callback: Function) => number;
  dispatchEvent: (eventId: number) => void;
};

let ws: any = null;
const HostConfig: any = {
  createInstance(type: any, props: any, ws: WebSocket, context: Context) {
    let { children, onClick, ...filteredProps } = props;
    console.log("createInstance", type, filteredProps);

    let events: any = {};
    if (onClick) {
      const eventId = context.registerEvent(onClick);
      events.click = eventId;
    }

    const id = context.createId();
    send(ws, [CREATE_INSTANCE, id, type, filteredProps, events]);
    return id;
  },

  createTextInstance(text: string, ws: WebSocket, context: Context) {
    console.log("createTextInstance", text);

    const id = context.createId();
    send(ws, [CREATE_TEXT_INSTANCE, id, text]);
    return id;
  },

  appendInitialChild(parent: any, child: any) {
    console.log("appendInitialChild", parent, child);

    send(ws, [APPEND_INITIAL_CHILD, parent, child]);
  },

  finalizeInitialChildren(element: any, type: any, props: any) {
    console.log("finalizeInitialChildren", type, props);
  },

  appendChildToContainer(ws: WebSocket, child: any) {
    console.log("appendChildToContainer", child);
    send(ws, [APPEND_CHILD_TO_CONTAINER, child]);
  },

  prepareUpdate(
    instance: any,
    type: any,
    oldProps: any,
    newProps: any,
    ws: WebSocket
  ) {
    // console.log("prepareUpdate", instance, type, oldProps, newProps);
  },

  commitTextUpdate(textInstance: any, oldText: string, newText: string) {
    console.log("commitTextUpdate", textInstance, oldText, newText);
    send(ws, [COMMIT_TEXT_UPDATE, textInstance, newText]);
  },

  getRootHostContext(ws: WebSocket): Context {
    console.log("getRootHostContext");

    let i = 0;
    function createId() {
      return ++i;
    }

    let events = new Map();
    function registerEvent(callback: Function) {
      const id = createId();
      events.set(id, callback);
      return id;
    }
    function dispatchEvent(id: number) {
      const callback = events.get(id);
      callback();
    }

    const context = {
      createId,
      registerEvent,
      dispatchEvent
    };
    (ws as any)._context = context;

    return context;
  },

  now() {
    return Date.now();
  },
  getChildHostContext: (context: Context) => {
    return context;
  },
  shouldSetTextContent(type: any, props: any) {
    return false;
  },
  prepareForCommit() {
    console.log("prepareForCommit");
  },
  resetAfterCommit() {
    console.log("resetAfterCommit");
  },
  supportsMutation: true
};

const LiveRenderer = Reconciler(HostConfig);

export default {
  render(element: JSX.Element, webSocket: WebSocket) {
    ws = webSocket;
    const root: Reconciler.FiberRoot = LiveRenderer.createContainer(
      ws,
      false,
      false
    );

    LiveRenderer.updateContainer(element, root, null, () => {});

    const context: Context = (ws as any)._context;

    ws.on("message", (data: any) => {
      data = JSON.parse(data);
      const type = data[0];

      switch (type) {
        case EVENT: {
          const [, eventId] = data;

          context.dispatchEvent(eventId);
          console.log("event", eventId);
          break;
        }
      }
    });
  }
};
