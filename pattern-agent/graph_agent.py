import networkx as nx
from fake_data import FAKE_CASES

_graph_cache = None

def build_graph():
    global _graph_cache
    if _graph_cache is not None:
        return _graph_cache

    G = nx.Graph()

    for case in FAKE_CASES:
        try:
            sender = case["sender"]
            receiver = case["receiver"]
            device = case.get("device_id")
            ip = case.get("ip")

            G.add_node(sender, type="person")
            G.add_node(receiver, type="person")
            G.add_edge(sender, receiver, case_id=case.get("case_id", "unknown"))

            if device:
                G.add_node(device, type="device")
                G.add_edge(sender, device, case_id=case.get("case_id", "unknown"))
            if ip:
                G.add_node(ip, type="ip")
                G.add_edge(sender, ip, case_id=case.get("case_id", "unknown"))
        except KeyError:
            continue

    _graph_cache = G
    return G

def find_linked_flagged_tokens(entity_token: str, hops: int = 2):
    try:
        if not entity_token or not entity_token.strip():
            return {"linked_tokens": [], "ring_size": 0, "note": "No token provided.", "error": None}

        G = build_graph()

        if entity_token not in G:
            return {
                "entity_token": entity_token,
                "linked_tokens": [],
                "ring_size": 0,
                "note": "Token not found in graph (no shared device/IP/receiver on record).",
                "error": None
            }

        nearby = nx.single_source_shortest_path_length(G, entity_token, cutoff=hops)

        linked_persons = [
            node for node, dist in nearby.items()
            if G.nodes[node].get("type") == "person" and node != entity_token
        ]

        return {
            "entity_token": entity_token,
            "linked_tokens": linked_persons,
            "ring_size": len(linked_persons),
            "error": None
        }

    except Exception as e:
        return {
            "entity_token": entity_token,
            "linked_tokens": [],
            "ring_size": 0,
            "error": str(e)
        }

if __name__ == "__main__":
    result = find_linked_flagged_tokens("PERSON_001")
    print(result)