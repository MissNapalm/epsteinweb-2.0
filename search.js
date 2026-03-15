(function() {
    const searchInput = document.getElementById('node-search');
    const searchResults = document.getElementById('search-results');

    if (!searchInput) return;

    // Hide the dropdown entirely - we don't need it
    if (searchResults) searchResults.style.display = 'none';

    searchInput.addEventListener('input', function() {
        const query = this.value.trim().toLowerCase();

        if (query.length < 1) {
            resetHighlight();
            return;
        }

        // Find best match as they type
        const matches = graphData.nodes.filter(n =>
            n.label.toLowerCase().includes(query)
        );

        if (matches.length === 0) {
            resetHighlight();
            return;
        }

        // Highlight the best match (exact start match first, then includes)
        const bestMatch = matches.find(n => n.label.toLowerCase().startsWith(query)) || matches[0];
        triggerNodeHover(bestMatch.id);
    });

    searchInput.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            this.value = '';
            this.blur();
            resetHighlight();
        }
    });

    function triggerNodeHover(nodeId) {
        // First try dispatching the real mouseover event that graph.js uses
        let dispatched = false;
        d3.selectAll('.node-group').each(function(d) {
            if (d && d.id === nodeId) {
                // Reset any previous hover first
                d3.selectAll('.node-group').each(function(dd) {
                    d3.select(this).dispatch('mouseout');
                });
                // Now trigger hover on the match
                d3.select(this).dispatch('mouseover');
                dispatched = true;
            }
        });

        if (!dispatched) {
            manualHighlight(nodeId);
        }
    }

    function manualHighlight(nodeId) {
        const connectedIds = new Set([nodeId]);
        graphData.links.forEach(link => {
            const s = typeof link.source === 'object' ? link.source.id : link.source;
            const t = typeof link.target === 'object' ? link.target.id : link.target;
            if (s === nodeId) connectedIds.add(t);
            if (t === nodeId) connectedIds.add(s);
        });

        d3.selectAll('.node-group').style('opacity', d =>
            connectedIds.has(d.id) ? 1 : 0.08
        );
        d3.selectAll('.link, line').each(function(d) {
            if (!d) return;
            const s = typeof d.source === 'object' ? d.source.id : d.source;
            const t = typeof d.target === 'object' ? d.target.id : d.target;
            d3.select(this).style('opacity', (s === nodeId || t === nodeId) ? 0.8 : 0.03);
        });
    }

    function resetHighlight() {
        d3.selectAll('.node-group').each(function() {
            d3.select(this).dispatch('mouseout');
        });
        d3.selectAll('.node-group').style('opacity', 1);
        d3.selectAll('.link, line').style('opacity', null);
    }
})();