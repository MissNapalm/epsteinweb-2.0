(function() {
    function waitForGraph() {
        if (typeof node === 'undefined' || d3.selectAll('circle').size() === 0) {
            setTimeout(waitForGraph, 200);
            return;
        }
        initSearch();
    }

    function initSearch() {
        const searchInput = document.getElementById('node-search');
        if (!searchInput) return;

        let currentHighlighted = null;
        const isDark = () => !document.body.classList.contains('light-mode');

        searchInput.addEventListener('input', function() {
            const query = this.value.trim().toLowerCase();

            if (query.length < 1) {
                resetAll();
                currentHighlighted = null;
                return;
            }

            // Find ALL matching nodes
            const matchIds = new Set();
            graphData.nodes.forEach(n => {
                if (n.label.toLowerCase().includes(query) || n.id.toLowerCase().includes(query)) {
                    matchIds.add(n.id);
                }
            });

            if (matchIds.size === 0) {
                resetAll();
                currentHighlighted = null;
                return;
            }

            // Find all nodes connected to ANY match
            const connectedIds = new Set(matchIds);
            graphData.links.forEach(l => {
                const s = typeof l.source === 'object' ? l.source.id : l.source;
                const t = typeof l.target === 'object' ? l.target.id : l.target;
                if (matchIds.has(s)) connectedIds.add(t);
                if (matchIds.has(t)) connectedIds.add(s);
            });

            // Use the global `node` selection from graph.js — it has correct data binding
            node.each(function(d) {
                const el = d3.select(this);
                if (matchIds.has(d.id)) {
                    el.style('opacity', 1);
                    el.select('circle')
                        .attr('r', d.radius * 1.3)
                        .style('filter', 'drop-shadow(0 0 12px rgba(255,255,255,0.6))');
                } else if (connectedIds.has(d.id)) {
                    el.style('opacity', 0.6);
                    el.select('circle')
                        .attr('r', d.radius)
                        .style('filter', null);
                } else {
                    el.style('opacity', 0.05);
                    el.select('circle')
                        .attr('r', d.radius)
                        .style('filter', null);
                }
            });

            // Dim/show links via the global `link` selection
            link.each(function(d) {
                const s = typeof d.source === 'object' ? d.source.id : d.source;
                const t = typeof d.target === 'object' ? d.target.id : d.target;
                const linked = matchIds.has(s) || matchIds.has(t);
                d3.select(this).attr('stroke-opacity', linked ? 0.7 : 0.02);
            });

            currentHighlighted = matchIds;
        });

        searchInput.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                this.value = '';
                this.blur();
                resetAll();
                currentHighlighted = null;
            }
        });

        function resetAll() {
            // Restore node opacity and circle radius using the global `node` selection
            const vis = typeof getVisibleNodes === 'function' ? getVisibleNodes() : null;
            node.each(function(d) {
                const el = d3.select(this);
                const visible = vis ? vis.has(d.id) : true;
                el.style('opacity', visible ? 1 : 0.04);
                el.select('circle')
                    .attr('r', d.radius)
                    .style('filter', null);
            });

            // Restore link opacity
            if (vis) {
                link.each(function(d) {
                    const s = typeof d.source === 'object' ? d.source.id : d.source;
                    const t = typeof d.target === 'object' ? d.target.id : d.target;
                    d3.select(this).attr('stroke-opacity', (vis.has(s) && vis.has(t)) ? 0.5 : 0.02);
                });
            } else {
                link.attr('stroke-opacity', 0.5);
            }
        }
    }

    waitForGraph();
})();