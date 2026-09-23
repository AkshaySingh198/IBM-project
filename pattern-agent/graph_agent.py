import networkx as nx
from fake_data import FAKE_CASES

def build_graph():
    G = nx.Graph()

    for case in FAKE_CASES:
        sender = case["sender"]
        receiver = case["receiver"]
        device = case["device_id"]
        ip = case["ip"]

        G.add_node(sender, type="person")
        G.add_node(receiver, type="person")
        G.add_node(device, type="device")
        G.add_node(ip, type="ip")

        G.add_edge(sender, device, case_id=case["case_id"])
        G.add_edge(sender, ip, case_id=case["case_id"])
        G.add_edge(sender, receiver, case_id=case["case_id"])

    return G

def find_linked_flagged_tokens(entity_token: str, hops: int = 2):
    G = build_graph()

    if entity_token not in G:
        return {"linked_tokens": [], "note": "Token not found in graph (no shared device/IP/receiver on record)."}

    nearby = nx.single_source_shortest_path_length(G, entity_token, cutoff=hops)

    linked_persons = [
        node for node, dist in nearby.items()
        if G.nodes[node].get("type") == "person" and node != entity_token
    ]

    return {
        "entity_token": entity_token,
        "linked_tokens": linked_persons,
        "ring_size": len(linked_persons)
    }

if __name__ == "__main__":
    result = find_linked_flagged_tokens("PERSON_001")
    print(result)