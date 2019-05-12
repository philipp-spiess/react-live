import * as Reconciler from "react-reconciler";
import * as WebSocket from "ws";

const CREATE_INSTANCE = "CREATE_INSTANCE";
const CREATE_TEXT_INSTANCE = "CREATE_TEXT_INSTANCE";
const APPEND_CHILD = "APPEND_CHILD";
const APPEND_CHILD_TO_CONTAINER = "APPEND_CHILD_TO_CONTAINER";
const REMOVE_CHILD = "REMOVE_CHILD";
const COMMIT_TEXT_UPDATE = "COMMIT_TEXT_UPDATE";
const PREPARE_UPDATE = "PREPARE_UPDATE";

const EVENT = "EVENT";

type Context = {
  createId: () => number;
  registerEvent: (
    instance: Instance,
    domEventName: string,
    callback: Function
  ) => void;
  dispatchEvent: (
    instance: Instance,
    domEventName: string,
    eventData: Object
  ) => void;
};

type Instance = number;

function createRenderer(ws: WebSocket): [any, Context] {
  let i = 0;
  function createId(): number {
    return ++i;
  }

  let instanceEventsMap: Map<Instance, Map<string, Function>> = new Map();
  function registerEvent(
    instance: Instance,
    domEventName: string,
    callback: Function
  ) {
    if (!instanceEventsMap.has(instance)) {
      instanceEventsMap.set(instance, new Map());
    }
    const eventMap: any = instanceEventsMap.get(instance);

    eventMap.set(domEventName, callback);
  }
  function dispatchEvent(
    instance: Instance,
    domEventName: string,
    eventData: Object
  ) {
    const eventMap: any = instanceEventsMap.get(instance);
    const callback: any = eventMap.get(domEventName);

    if (typeof callback === "function") {
      callback(eventData);
    }
  }

  const context = {
    createId,
    registerEvent,
    dispatchEvent
  };

  let queue: Array<Object> = [];
  function send(data: any) {
    queue.push(data);
  }
  function flush() {
    if (queue.length === 0) {
      return;
    }
    ws.send(JSON.stringify(queue));
    queue = [];
  }

  const HostConfig: any = {
    createInstance(type: any, props: any, ws: WebSocket, context: Context) {
      const instanceId = context.createId();

      let newEventListeners: Array<string> = [];

      let filteredProps: any = {};
      for (let prop in props) {
        const value = props[prop];

        if (prop === "children") {
          // ignore
        } else if (isEventProp(prop)) {
          const domEventName = reactEventToDomEvent(prop);

          context.registerEvent(instanceId, domEventName, value);

          if (value !== undefined) {
            newEventListeners.push(domEventName);
          }
        } else {
          filteredProps[prop] = value;
        }
      }

      send([
        CREATE_INSTANCE,
        instanceId,
        type,
        filteredProps,
        newEventListeners
      ]);
      return instanceId;
    },

    createTextInstance(text: string, ws: WebSocket, context: Context) {
      const id = context.createId();
      send([CREATE_TEXT_INSTANCE, id, text]);
      return id;
    },

    appendInitialChild(parent: Instance, child: Instance) {
      send([APPEND_CHILD, parent, child]);
    },
    appendChild(parent: Instance, child: Instance) {
      send([APPEND_CHILD, parent, child]);
    },
    removeChild(parent: Instance, child: Instance) {
      send([REMOVE_CHILD, parent, child]);
    },

    finalizeInitialChildren(element: any, type: any, props: any) {},

    appendChildToContainer(ws: WebSocket, child: any) {
      send([APPEND_CHILD_TO_CONTAINER, child]);
    },

    prepareUpdate(instance: any, type: any, oldProps: any, newProps: any) {
      let filteredProps: any = {};
      let newEventListeners: Array<String> = [];
      for (let prop in newProps) {
        const value = newProps[prop];

        if (prop === "children") {
          continue;
        }

        if (oldProps[prop] === value) {
          continue;
        }

        if (isEventProp(prop)) {
          const domEventName = reactEventToDomEvent(prop);

          context.registerEvent(instance, domEventName, value);

          if (oldProps[prop] === undefined && value !== undefined) {
            newEventListeners.push(domEventName);
          }
        } else {
          filteredProps[prop] = value;
        }
      }

      send([PREPARE_UPDATE, instance, filteredProps, newEventListeners]);
    },

    commitTextUpdate(textInstance: any, oldText: string, newText: string) {
      send([COMMIT_TEXT_UPDATE, textInstance, newText]);
    },

    getRootHostContext(ws: WebSocket): Context {
      return context;
    },

    getChildHostContext: (context: Context) => {
      return context;
    },

    shouldSetTextContent(type: any, props: any) {
      return false;
    },

    prepareForCommit() {},
    resetAfterCommit() {
      flush();
    },

    now() {
      return Date.now();
    },
    supportsMutation: true
  };

  return [Reconciler(HostConfig), context];
}

export default {
  render(element: JSX.Element, ws: WebSocket) {
    const [LiveRenderer, context] = createRenderer(ws);

    const root: Reconciler.FiberRoot = LiveRenderer.createContainer(
      ws,
      false,
      false
    );

    LiveRenderer.updateContainer(element, root, null, () => {});

    ws.on("message", (data: any) => {
      data = JSON.parse(data);
      const type = data[0];

      switch (type) {
        case EVENT: {
          const [, instance, eventName, eventData] = data;
          context.dispatchEvent(instance, eventName, eventData);
          break;
        }
      }
    });
  }
};

function isEventProp(name: string): boolean {
  if (
    name.length > 2 &&
    name[0] === "o" &&
    name[1] === "n" &&
    name[2] === name[2].toUpperCase()
  ) {
    return true;
  } else {
    return false;
  }
}

function reactEventToDomEvent(name: string): string {
  return name.toLowerCase().slice(2);
}
