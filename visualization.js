/**
 * Clase para visualizar autómatas usando D3.js
 */
class AutomataVisualizer {
    constructor(svgSelector) {
        this.svg = d3.select(svgSelector);
        this.width = 800;
        this.height = 500;
        this.currentAutomaton = null;
        this.simulation = null;
        this.nodes = [];
        this.links = [];
        
        this.setupSVG();
        this.setupZoom();
        this.setupMarkers();
    }

    /**
     * Configura el SVG base
     */
    setupSVG() {
        this.svg
            .attr('width', this.width)
            .attr('height', this.height)
            .style('background', '#f8fafc')
            .style('border-radius', '0.5rem');

        // Grupo principal para zoom y pan
        this.mainGroup = this.svg.append('g')
            .attr('class', 'main-group');
    }

    /**
     * Configura el zoom y pan
     */
    setupZoom() {
        this.zoom = d3.zoom()
            .scaleExtent([0.1, 4])
            .on('zoom', (event) => {
                this.mainGroup.attr('transform', event.transform);
            });

        this.svg.call(this.zoom);
    }

    /**
     * Configura los marcadores para las flechas
     */
    setupMarkers() {
        const defs = this.svg.append('defs');

        // Marcador para flechas normales
        defs.append('marker')
            .attr('id', 'arrowhead')
            .attr('viewBox', '0 -5 10 10')
            .attr('refX', 25)
            .attr('refY', 0)
            .attr('markerWidth', 6)
            .attr('markerHeight', 6)
            .attr('orient', 'auto')
            .append('path')
            .attr('d', 'M0,-5L10,0L0,5')
            .attr('fill', '#64748b');

        // Marcador para flechas activas
        defs.append('marker')
            .attr('id', 'arrowhead-active')
            .attr('viewBox', '0 -5 10 10')
            .attr('refX', 25)
            .attr('refY', 0)
            .attr('markerWidth', 6)
            .attr('markerHeight', 6)
            .attr('orient', 'auto')
            .append('path')
            .attr('d', 'M0,-5L10,0L0,5')
            .attr('fill', '#2563eb');
    }

    /**
     * Visualiza un autómata
     * @param {FiniteAutomaton} automaton - Autómata a visualizar
     */
    visualize(automaton) {
        this.currentAutomaton = automaton;
        this.prepareData();
        this.createSimulation();
        this.render();
    }

    /**
     * Prepara los datos para la visualización
     */
    prepareData() {
        if (!this.currentAutomaton) return;

        const info = this.currentAutomaton.getInfo();
        
        // Crear nodos
        this.nodes = info.states.map(state => ({
            id: state,
            name: state,
            isInitial: state === info.initialState,
            isFinal: info.finalStates.includes(state),
            x: Math.random() * (this.width - 100) + 50,
            y: Math.random() * (this.height - 100) + 50
        }));

        // Crear enlaces (transiciones)
        this.links = [];
        const transitionGroups = new Map();

        // Agrupar transiciones entre los mismos estados
        info.transitions.forEach(transition => {
            const key = `${transition.from}-${transition.to}`;
            if (!transitionGroups.has(key)) {
                transitionGroups.set(key, {
                    source: transition.from,
                    target: transition.to,
                    symbols: []
                });
            }
            transitionGroups.get(key).symbols.push(transition.symbol);
        });

        // Convertir grupos a enlaces
        transitionGroups.forEach(group => {
            this.links.push({
                source: group.source,
                target: group.target,
                symbols: group.symbols,
                label: group.symbols.join(', ')
            });
        });
    }

    /**
     * Crea la simulación de fuerzas
     */
    createSimulation() {
        if (this.simulation) {
            this.simulation.stop();
        }

        this.simulation = d3.forceSimulation(this.nodes)
            .force('link', d3.forceLink(this.links)
                .id(d => d.id)
                .distance(150)
                .strength(0.5))
            .force('charge', d3.forceManyBody()
                .strength(-300))
            .force('center', d3.forceCenter(this.width / 2, this.height / 2))
            .force('collision', d3.forceCollide()
                .radius(40));
    }

    /**
     * Renderiza la visualización
     */
    render() {
        // Limpiar contenido anterior
        this.mainGroup.selectAll('*').remove();

        // Crear enlaces
        const linkGroup = this.mainGroup.append('g')
            .attr('class', 'links');

        const link = linkGroup.selectAll('.link')
            .data(this.links)
            .enter().append('g')
            .attr('class', 'link-group');

        // Líneas de transición
        const linkPath = link.append('path')
            .attr('class', 'link')
            .attr('fill', 'none')
            .attr('stroke', '#64748b')
            .attr('stroke-width', 2)
            .attr('marker-end', 'url(#arrowhead)');

        // Etiquetas de transición
        const linkLabel = link.append('text')
            .attr('class', 'link-label')
            .attr('text-anchor', 'middle')
            .attr('dominant-baseline', 'central')
            .attr('font-size', '12px')
            .attr('font-weight', '500')
            .attr('fill', '#1e293b')
            .text(d => d.label);

        // Crear nodos
        const nodeGroup = this.mainGroup.append('g')
            .attr('class', 'nodes');

        const node = nodeGroup.selectAll('.node')
            .data(this.nodes)
            .enter().append('g')
            .attr('class', 'node')
            .call(d3.drag()
                .on('start', this.dragStarted.bind(this))
                .on('drag', this.dragged.bind(this))
                .on('end', this.dragEnded.bind(this)));

        // Círculos de estados
        node.append('circle')
            .attr('r', 20)
            .attr('fill', '#ffffff')
            .attr('stroke', '#2563eb')
            .attr('stroke-width', d => d.isInitial ? 3 : 2)
            .attr('stroke-dasharray', d => d.isFinal ? '5,5' : 'none');

        // Etiquetas de estados
        node.append('text')
            .attr('text-anchor', 'middle')
            .attr('dominant-baseline', 'central')
            .attr('font-size', '14px')
            .attr('font-weight', '500')
            .attr('fill', '#1e293b')
            .text(d => d.name);

        // Indicador de estado inicial
        node.filter(d => d.isInitial)
            .append('path')
            .attr('d', 'M-35,-5 L-25,0 L-35,5')
            .attr('fill', '#2563eb')
            .attr('stroke', '#2563eb')
            .attr('stroke-width', 2);

        // Actualizar posiciones en cada tick de la simulación
        this.simulation.on('tick', () => {
            // Actualizar posiciones de enlaces
            linkPath.attr('d', d => {
                const dx = d.target.x - d.source.x;
                const dy = d.target.y - d.source.y;
                const dr = Math.sqrt(dx * dx + dy * dy) * 2;
                
                // Crear arco para evitar superposición
                return `M${d.source.x},${d.source.y}A${dr},${dr} 0 0,1 ${d.target.x},${d.target.y}`;
            });

            // Actualizar posiciones de etiquetas de enlaces
            linkLabel
                .attr('x', d => (d.source.x + d.target.x) / 2)
                .attr('y', d => (d.source.y + d.target.y) / 2 - 10);

            // Actualizar posiciones de nodos
            node.attr('transform', d => `translate(${d.x},${d.y})`);
        });
    }

    /**
     * Maneja el inicio del arrastre
     */
    dragStarted(event, d) {
        if (!event.active) this.simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
    }

    /**
     * Maneja el arrastre
     */
    dragged(event, d) {
        d.fx = event.x;
        d.fy = event.y;
    }

    /**
     * Maneja el final del arrastre
     */
    dragEnded(event, d) {
        if (!event.active) this.simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
    }

    /**
     * Resalta el camino de ejecución
     * @param {Array} path - Camino de ejecución
     */
    highlightPath(path) {
        // Resetear estilos
        this.mainGroup.selectAll('.node circle')
            .classed('active', false)
            .attr('fill', '#ffffff');

        this.mainGroup.selectAll('.link')
            .classed('active', false)
            .attr('stroke', '#64748b')
            .attr('stroke-width', 2)
            .attr('marker-end', 'url(#arrowhead)');

        if (!path || path.length === 0) return;

        // Resaltar estados en el camino
        path.forEach((step, index) => {
            setTimeout(() => {
                this.mainGroup.selectAll('.node')
                    .filter(d => d.id === step.state)
                    .select('circle')
                    .classed('active', true)
                    .attr('fill', '#2563eb');

                // Resaltar transición
                if (index > 0) {
                    const prevStep = path[index - 1];
                    this.mainGroup.selectAll('.link')
                        .filter(d => d.source.id === prevStep.state && d.target.id === step.state)
                        .classed('active', true)
                        .attr('stroke', '#2563eb')
                        .attr('stroke-width', 3)
                        .attr('marker-end', 'url(#arrowhead-active)');
                }
            }, index * 500);
        });
    }

    /**
     * Centra la visualización
     */
    centerGraph() {
        const bounds = this.mainGroup.node().getBBox();
        const fullWidth = this.width;
        const fullHeight = this.height;
        const width = bounds.width;
        const height = bounds.height;
        const midX = bounds.x + width / 2;
        const midY = bounds.y + height / 2;

        if (width === 0 || height === 0) return;

        const scale = Math.min(fullWidth / width, fullHeight / height) * 0.8;
        const translate = [fullWidth / 2 - scale * midX, fullHeight / 2 - scale * midY];

        this.svg.transition()
            .duration(750)
            .call(this.zoom.transform, d3.zoomIdentity.translate(translate[0], translate[1]).scale(scale));
    }

    /**
     * Resetea el zoom
     */
    resetZoom() {
        this.svg.transition()
            .duration(750)
            .call(this.zoom.transform, d3.zoomIdentity);
    }

    /**
     * Limpia la visualización
     */
    clear() {
        if (this.simulation) {
            this.simulation.stop();
        }
        this.mainGroup.selectAll('*').remove();
        this.currentAutomaton = null;
        this.nodes = [];
        this.links = [];
    }

    /**
     * Redimensiona la visualización
     * @param {number} width - Nuevo ancho
     * @param {number} height - Nueva altura
     */
    resize(width, height) {
        this.width = width;
        this.height = height;
        
        this.svg
            .attr('width', width)
            .attr('height', height);

        if (this.simulation) {
            this.simulation
                .force('center', d3.forceCenter(width / 2, height / 2))
                .alpha(0.3)
                .restart();
        }
    }
}
