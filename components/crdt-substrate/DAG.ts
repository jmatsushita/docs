export type NodeID = "ROOT" | `${NodeName}-${number}`;

export type DAGNode = {
  parents: Set<NodeID>;
  id: NodeID;
  event: Event;
};

export type Event = {
  mutationName: string;
  mutationArgs: any[];
};

export type NodeName = "nodeA" | "nodeB" | "nodeC";

const sequenceNumbers = {
  nodeA: 0,
  nodeB: 0,
  nodeC: 0,
};

export default class DAG {
  root: DAGNode;
  nodeRelation: Map<NodeID, DAGNode> = new Map();

  constructor(public nodeName: NodeName, root?: DAGNode) {
    if (root) {
      this.root = root;
    } else {
      this.root = {
        parents: new Set(),
        id: "ROOT",
        event: {
          mutationName: "",
          mutationArgs: [],
        },
      };
    }

    this.nodeRelation.set(this.root.id, this.root);
  }

  addEvent(event: Event) {
    const node: DAGNode = {
      parents: this.findLeaves(),
      id: `${this.nodeName}-${sequenceNumbers[this.nodeName]++}`,
      event,
    };
    this.nodeRelation.set(node.id, node);

    return node;
  }

  findLeaves(): Set<NodeID> {
    const leaves = new Set<NodeID>([...this.nodeRelation.keys()]);
    for (const n of this.nodeRelation.values()) {
      // if p is a parent then it is not a leaf. Remove it from the leaves set.
      for (const p of n.parents) {
        leaves.delete(p);
      }
    }

    return leaves;
  }

  getEventsInOrder(): DAGNode[] {
    const graph = new Map<NodeID, DAGNode[]>();
    for (const n of this.nodeRelation.keys()) {
      graph.set(n, []);
    }

    // Convert the graph so we have child pointers.
    for (const n of this.nodeRelation.values()) {
      for (const p of n.parents) {
        graph.get(p)!.push(n);
      }
    }

    // Now sort the children of each node by their id. IDs never collide given node id is encoded into the id.
    for (const children of graph.values()) {
      children.sort((a, b) => {
        const [aNode, aRawSeq] = a.id.split("-");
        const [bNode, bRawSeq] = b.id.split("-");
        const aSeq = parseInt(aRawSeq);
        const bSeq = parseInt(bRawSeq);
        if (aSeq == bSeq) {
          return aNode < bNode ? -1 : 1;
        }
        return aSeq - bSeq;
      });
    }

    // Finally do our depth first traversal.
    const events: DAGNode[] = [];
    const visited = new Set<DAGNode>();
    const visit = (n: DAGNode) => {
      if (visited.has(n)) {
        return;
      }
      visited.add(n);
      if (n.id != "ROOT") events.push(n);
      for (const c of graph.get(n.id)!) {
        visit(c);
      }
    };
    visit(this.root);

    return events;
  }

  // Merging trees is trivial. They're already correctly parented so all we need to do is merge the relations.
  merge(other: DAG): DAG {
    const ret = new DAG(this.nodeName);
    ret.nodeRelation = new Map([...this.nodeRelation, ...other.nodeRelation]);
    return ret;
  }

  // Note: this mutates the input
  applyTo(state: any, mutations: any): any {
    const events = this.getEventsInOrder();
    for (const e of events) {
      mutations[e.event.mutationName](state, ...e.event.mutationArgs);
    }
    return state;
  }
}
