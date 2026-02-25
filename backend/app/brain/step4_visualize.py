"""STEP 4: Mermaid Visualization - 図解生成."""

from app.models.schemas import BarrierAnalysis, CausalityResult, ABCClassification


class MermaidVisualizer:
    """Generates Mermaid diagrams for barrier visualization."""

    def generate(
        self,
        barriers: BarrierAnalysis,
        causality: CausalityResult,
        classification: ABCClassification,
    ) -> str:
        """Generate Mermaid diagram combining all barrier analysis."""
        # Create barrier ID to classification mapping
        classification_map = {}
        for item in classification.a_items:
            classification_map[item.barrier_id] = "A"
        for item in classification.b_items:
            classification_map[item.barrier_id] = "B"
        for item in classification.c_items:
            classification_map[item.barrier_id] = "C"

        # Create barrier ID to text mapping
        barrier_map = {b.id: b.barrier for b in barriers.barriers}

        # Build Mermaid flowchart
        lines = ["flowchart TB"]

        # Add subgraphs for each classification
        lines.append("    subgraph A_SERVICE[A: サービスで解決]")
        for item in classification.a_items:
            short_text = self._truncate(barrier_map.get(item.barrier_id, item.barrier))
            lines.append(f'        A{item.barrier_id}["{short_text}"]')
        lines.append("    end")

        lines.append("    subgraph B_BRAND[B: 広告・ブランディングで解決]")
        for item in classification.b_items:
            short_text = self._truncate(barrier_map.get(item.barrier_id, item.barrier))
            lines.append(f'        B{item.barrier_id}["{short_text}"]')
        lines.append("    end")

        lines.append("    subgraph C_PR[C: PR・社会変容で解決]")
        for item in classification.c_items:
            short_text = self._truncate(barrier_map.get(item.barrier_id, item.barrier))
            lines.append(f'        C{item.barrier_id}["{short_text}"]')
        lines.append("    end")

        # Add key barrier highlighting
        lines.append("")
        lines.append("    %% Key barriers (high connectivity)")
        for key_id in causality.key_barriers:
            cls = classification_map.get(key_id, "A")
            lines.append(f"    style {cls}{key_id} fill:#ff6b6b,stroke:#c92a2a")

        # Add causal relationships (limited to avoid clutter)
        lines.append("")
        lines.append("    %% Causal relationships")
        added_relations = 0
        for rel in causality.relations:
            if added_relations >= 30:  # Limit to avoid cluttered diagram
                break
            from_cls = classification_map.get(rel.from_id, "A")
            to_cls = classification_map.get(rel.to_id, "A")
            lines.append(f"    {from_cls}{rel.from_id} --> {to_cls}{rel.to_id}")
            added_relations += 1

        # Add styling
        lines.append("")
        lines.append("    %% Styling")
        lines.append("    style A_SERVICE fill:#d4edda,stroke:#28a745")
        lines.append("    style B_BRAND fill:#fff3cd,stroke:#ffc107")
        lines.append("    style C_PR fill:#cce5ff,stroke:#007bff")

        return "\n".join(lines)

    def _truncate(self, text: str, max_length: int = 20) -> str:
        """Truncate text for diagram readability."""
        if len(text) <= max_length:
            return text
        return text[:max_length - 3] + "..."
