
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    let src_url_equal_anchor;
    function src_url_equal(element_src, url) {
        if (!src_url_equal_anchor) {
            src_url_equal_anchor = document.createElement('a');
        }
        src_url_equal_anchor.href = url;
        return element_src === src_url_equal_anchor.href;
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function validate_store(store, name) {
        if (store != null && typeof store.subscribe !== 'function') {
            throw new Error(`'${name}' is not a store with a 'subscribe' method`);
        }
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
    }
    function create_slot(definition, ctx, $$scope, fn) {
        if (definition) {
            const slot_ctx = get_slot_context(definition, ctx, $$scope, fn);
            return definition[0](slot_ctx);
        }
    }
    function get_slot_context(definition, ctx, $$scope, fn) {
        return definition[1] && fn
            ? assign($$scope.ctx.slice(), definition[1](fn(ctx)))
            : $$scope.ctx;
    }
    function get_slot_changes(definition, $$scope, dirty, fn) {
        if (definition[2] && fn) {
            const lets = definition[2](fn(dirty));
            if ($$scope.dirty === undefined) {
                return lets;
            }
            if (typeof lets === 'object') {
                const merged = [];
                const len = Math.max($$scope.dirty.length, lets.length);
                for (let i = 0; i < len; i += 1) {
                    merged[i] = $$scope.dirty[i] | lets[i];
                }
                return merged;
            }
            return $$scope.dirty | lets;
        }
        return $$scope.dirty;
    }
    function update_slot_base(slot, slot_definition, ctx, $$scope, slot_changes, get_slot_context_fn) {
        if (slot_changes) {
            const slot_context = get_slot_context(slot_definition, ctx, $$scope, get_slot_context_fn);
            slot.p(slot_context, slot_changes);
        }
    }
    function get_all_dirty_from_scope($$scope) {
        if ($$scope.ctx.length > 32) {
            const dirty = [];
            const length = $$scope.ctx.length / 32;
            for (let i = 0; i < length; i++) {
                dirty[i] = -1;
            }
            return dirty;
        }
        return -1;
    }
    function null_to_empty(value) {
        return value == null ? '' : value;
    }
    function set_store_value(store, ret, value) {
        store.set(value);
        return ret;
    }
    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function custom_event(type, detail, { bubbles = false, cancelable = false } = {}) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, cancelable, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    // TODO figure out if we still want to support
    // shorthand events, or if we want to implement
    // a real bubbling mechanism
    function bubble(component, event) {
        const callbacks = component.$$.callbacks[event.type];
        if (callbacks) {
            // @ts-ignore
            callbacks.slice().forEach(fn => fn.call(this, event));
        }
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    // flush() calls callbacks in this order:
    // 1. All beforeUpdate callbacks, in order: parents before children
    // 2. All bind:this callbacks, in reverse order: children before parents.
    // 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
    //    for afterUpdates called during the initial onMount, which are called in
    //    reverse order: children before parents.
    // Since callbacks might update component values, which could trigger another
    // call to flush(), the following steps guard against this:
    // 1. During beforeUpdate, any updated components will be added to the
    //    dirty_components array and will cause a reentrant call to flush(). Because
    //    the flush index is kept outside the function, the reentrant call will pick
    //    up where the earlier call left off and go through all dirty components. The
    //    current_component value is saved and restored so that the reentrant call will
    //    not interfere with the "parent" flush() call.
    // 2. bind:this callbacks cannot trigger new flush() calls.
    // 3. During afterUpdate, any updated components will NOT have their afterUpdate
    //    callback called a second time; the seen_callbacks set, outside the flush()
    //    function, guarantees this behavior.
    const seen_callbacks = new Set();
    let flushidx = 0; // Do *not* move this inside the flush() function
    function flush() {
        const saved_component = current_component;
        do {
            // first, call beforeUpdate functions
            // and update components
            while (flushidx < dirty_components.length) {
                const component = dirty_components[flushidx];
                flushidx++;
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            flushidx = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        seen_callbacks.clear();
        set_current_component(saved_component);
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
        else if (callback) {
            callback();
        }
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.49.0' }, detail), { bubbles: true }));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    const subscriber_queue = [];
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = new Set();
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (const subscriber of subscribers) {
                        subscriber[1]();
                        subscriber_queue.push(subscriber, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.add(subscriber);
            if (subscribers.size === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                subscribers.delete(subscriber);
                if (subscribers.size === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }

    const filterKeys = writable([]);

    /* src\UI\Button.svelte generated by Svelte v3.49.0 */

    const file$4 = "src\\UI\\Button.svelte";

    function create_fragment$4(ctx) {
    	let button;
    	let button_class_value;
    	let current;
    	let mounted;
    	let dispose;
    	const default_slot_template = /*#slots*/ ctx[2].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[1], null);

    	const block = {
    		c: function create() {
    			button = element("button");
    			if (default_slot) default_slot.c();

    			attr_dev(button, "class", button_class_value = "" + (null_to_empty(/*selected*/ ctx[0] === true
    			? "applied-filter"
    			: "filter") + " svelte-1vvgpf2"));

    			add_location(button, file$4, 4, 0, 48);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);

    			if (default_slot) {
    				default_slot.m(button, null);
    			}

    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*click_handler*/ ctx[3], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && (!current || dirty & /*$$scope*/ 2)) {
    					update_slot_base(
    						default_slot,
    						default_slot_template,
    						ctx,
    						/*$$scope*/ ctx[1],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[1])
    						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[1], dirty, null),
    						null
    					);
    				}
    			}

    			if (!current || dirty & /*selected*/ 1 && button_class_value !== (button_class_value = "" + (null_to_empty(/*selected*/ ctx[0] === true
    			? "applied-filter"
    			: "filter") + " svelte-1vvgpf2"))) {
    				attr_dev(button, "class", button_class_value);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			if (default_slot) default_slot.d(detaching);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Button', slots, ['default']);
    	let { selected = false } = $$props;
    	const writable_props = ['selected'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Button> was created with unknown prop '${key}'`);
    	});

    	function click_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	$$self.$$set = $$props => {
    		if ('selected' in $$props) $$invalidate(0, selected = $$props.selected);
    		if ('$$scope' in $$props) $$invalidate(1, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({ selected });

    	$$self.$inject_state = $$props => {
    		if ('selected' in $$props) $$invalidate(0, selected = $$props.selected);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [selected, $$scope, slots, click_handler];
    }

    class Button extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, { selected: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Button",
    			options,
    			id: create_fragment$4.name
    		});
    	}

    	get selected() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set selected(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\Components\Job.svelte generated by Svelte v3.49.0 */

    const { Object: Object_1$2, console: console_1$1 } = globals;
    const file$3 = "src\\Components\\Job.svelte";

    function get_each_context$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[17] = list[i];
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[20] = list[i];
    	return child_ctx;
    }

    // (40:4) {#if newPost !== false}
    function create_if_block_2(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "NEW!";
    			attr_dev(p, "class", "new svelte-k6a6h");
    			add_location(p, file$3, 40, 6, 994);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(40:4) {#if newPost !== false}",
    		ctx
    	});

    	return block;
    }

    // (43:4) {#if featured !== false}
    function create_if_block_1(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "FEATURED";
    			attr_dev(p, "class", "featured svelte-k6a6h");
    			add_location(p, file$3, 43, 6, 1063);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(43:4) {#if featured !== false}",
    		ctx
    	});

    	return block;
    }

    // (55:4) <Button on:click={() => setFilter({ role })}>
    function create_default_slot_3(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text(/*role*/ ctx[5]);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*role*/ 32) set_data_dev(t, /*role*/ ctx[5]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_3.name,
    		type: "slot",
    		source: "(55:4) <Button on:click={() => setFilter({ role })}>",
    		ctx
    	});

    	return block;
    }

    // (56:4) <Button on:click={() => setFilter({ level })}>
    function create_default_slot_2(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text(/*level*/ ctx[6]);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*level*/ 64) set_data_dev(t, /*level*/ ctx[6]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_2.name,
    		type: "slot",
    		source: "(56:4) <Button on:click={() => setFilter({ level })}>",
    		ctx
    	});

    	return block;
    }

    // (58:6) <Button on:click={() => setFilter({ language })}>
    function create_default_slot_1(ctx) {
    	let t_value = /*language*/ ctx[20] + "";
    	let t;

    	const block = {
    		c: function create() {
    			t = text(t_value);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*languages*/ 1024 && t_value !== (t_value = /*language*/ ctx[20] + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_1.name,
    		type: "slot",
    		source: "(58:6) <Button on:click={() => setFilter({ language })}>",
    		ctx
    	});

    	return block;
    }

    // (57:4) {#each languages as language}
    function create_each_block_1(ctx) {
    	let button;
    	let current;

    	function click_handler_2() {
    		return /*click_handler_2*/ ctx[15](/*language*/ ctx[20]);
    	}

    	button = new Button({
    			props: {
    				$$slots: { default: [create_default_slot_1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	button.$on("click", click_handler_2);

    	const block = {
    		c: function create() {
    			create_component(button.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(button, target, anchor);
    			current = true;
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			const button_changes = {};

    			if (dirty & /*$$scope, languages*/ 8389632) {
    				button_changes.$$scope = { dirty, ctx };
    			}

    			button.$set(button_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(button.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(button.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(button, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(57:4) {#each languages as language}",
    		ctx
    	});

    	return block;
    }

    // (60:4) {#if tools.length !== 0}
    function create_if_block$1(ctx) {
    	let each_1_anchor;
    	let current;
    	let each_value = /*tools*/ ctx[11];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$2(get_each_context$2(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*setFilter, tools*/ 6144) {
    				each_value = /*tools*/ ctx[11];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$2(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block$2(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(60:4) {#if tools.length !== 0}",
    		ctx
    	});

    	return block;
    }

    // (62:8) <Button on:click={() => setFilter({ tool })}>
    function create_default_slot$1(ctx) {
    	let t_value = /*tool*/ ctx[17] + "";
    	let t;

    	const block = {
    		c: function create() {
    			t = text(t_value);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*tools*/ 2048 && t_value !== (t_value = /*tool*/ ctx[17] + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$1.name,
    		type: "slot",
    		source: "(62:8) <Button on:click={() => setFilter({ tool })}>",
    		ctx
    	});

    	return block;
    }

    // (61:6) {#each tools as tool}
    function create_each_block$2(ctx) {
    	let button;
    	let current;

    	function click_handler_3() {
    		return /*click_handler_3*/ ctx[16](/*tool*/ ctx[17]);
    	}

    	button = new Button({
    			props: {
    				$$slots: { default: [create_default_slot$1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	button.$on("click", click_handler_3);

    	const block = {
    		c: function create() {
    			create_component(button.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(button, target, anchor);
    			current = true;
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			const button_changes = {};

    			if (dirty & /*$$scope, tools*/ 8390656) {
    				button_changes.$$scope = { dirty, ctx };
    			}

    			button.$set(button_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(button.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(button.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(button, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$2.name,
    		type: "each",
    		source: "(61:6) {#each tools as tool}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let section;
    	let div;
    	let img;
    	let img_src_value;
    	let t0;
    	let span0;
    	let p0;
    	let t1;
    	let t2;
    	let t3;
    	let t4;
    	let h4;
    	let t5;
    	let t6;
    	let span1;
    	let p1;
    	let t7;
    	let t8;
    	let t9;
    	let p2;
    	let t10;
    	let t11;
    	let t12;
    	let p3;
    	let t13;
    	let t14;
    	let t15;
    	let hr;
    	let t16;
    	let span2;
    	let button0;
    	let t17;
    	let button1;
    	let t18;
    	let t19;
    	let section_class_value;
    	let current;
    	let if_block0 = /*newPost*/ ctx[2] !== false && create_if_block_2(ctx);
    	let if_block1 = /*featured*/ ctx[3] !== false && create_if_block_1(ctx);

    	button0 = new Button({
    			props: {
    				$$slots: { default: [create_default_slot_3] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	button0.$on("click", /*click_handler*/ ctx[13]);

    	button1 = new Button({
    			props: {
    				$$slots: { default: [create_default_slot_2] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	button1.$on("click", /*click_handler_1*/ ctx[14]);
    	let each_value_1 = /*languages*/ ctx[10];
    	validate_each_argument(each_value_1);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	let if_block2 = /*tools*/ ctx[11].length !== 0 && create_if_block$1(ctx);

    	const block = {
    		c: function create() {
    			section = element("section");
    			div = element("div");
    			img = element("img");
    			t0 = space();
    			span0 = element("span");
    			p0 = element("p");
    			t1 = text(/*company*/ ctx[0]);
    			t2 = space();
    			if (if_block0) if_block0.c();
    			t3 = space();
    			if (if_block1) if_block1.c();
    			t4 = space();
    			h4 = element("h4");
    			t5 = text(/*position*/ ctx[4]);
    			t6 = space();
    			span1 = element("span");
    			p1 = element("p");
    			t7 = text(/*postedAt*/ ctx[7]);
    			t8 = text("   ·  ");
    			t9 = space();
    			p2 = element("p");
    			t10 = text(/*contract*/ ctx[8]);
    			t11 = text("   ·  ");
    			t12 = space();
    			p3 = element("p");
    			t13 = text(/*location*/ ctx[9]);
    			t14 = text(" ");
    			t15 = space();
    			hr = element("hr");
    			t16 = space();
    			span2 = element("span");
    			create_component(button0.$$.fragment);
    			t17 = space();
    			create_component(button1.$$.fragment);
    			t18 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t19 = space();
    			if (if_block2) if_block2.c();
    			if (!src_url_equal(img.src, img_src_value = /*logo*/ ctx[1])) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", /*company*/ ctx[0]);
    			add_location(img, file$3, 35, 4, 851);
    			attr_dev(div, "class", "job__photo svelte-k6a6h");
    			add_location(div, file$3, 34, 2, 822);
    			attr_dev(p0, "class", "company svelte-k6a6h");
    			add_location(p0, file$3, 38, 4, 927);
    			attr_dev(span0, "class", "job__company svelte-k6a6h");
    			add_location(span0, file$3, 37, 2, 895);
    			attr_dev(h4, "class", "job__title svelte-k6a6h");
    			add_location(h4, file$3, 46, 2, 1118);
    			attr_dev(p1, "class", "posted-at svelte-k6a6h");
    			add_location(p1, file$3, 48, 4, 1203);
    			attr_dev(p2, "class", "contract svelte-k6a6h");
    			add_location(p2, file$3, 49, 4, 1265);
    			attr_dev(p3, "class", "location svelte-k6a6h");
    			add_location(p3, file$3, 50, 4, 1326);
    			attr_dev(span1, "class", "job__details--commitment svelte-k6a6h");
    			add_location(span1, file$3, 47, 2, 1159);
    			attr_dev(hr, "class", "svelte-k6a6h");
    			add_location(hr, file$3, 52, 2, 1379);
    			attr_dev(span2, "class", "job__details--stack svelte-k6a6h");
    			add_location(span2, file$3, 53, 2, 1388);
    			attr_dev(section, "class", section_class_value = "" + (null_to_empty(/*featured*/ ctx[3] !== false ? "job job--new" : "job") + " svelte-k6a6h"));
    			add_location(section, file$3, 31, 0, 755);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, section, anchor);
    			append_dev(section, div);
    			append_dev(div, img);
    			append_dev(section, t0);
    			append_dev(section, span0);
    			append_dev(span0, p0);
    			append_dev(p0, t1);
    			append_dev(span0, t2);
    			if (if_block0) if_block0.m(span0, null);
    			append_dev(span0, t3);
    			if (if_block1) if_block1.m(span0, null);
    			append_dev(section, t4);
    			append_dev(section, h4);
    			append_dev(h4, t5);
    			append_dev(section, t6);
    			append_dev(section, span1);
    			append_dev(span1, p1);
    			append_dev(p1, t7);
    			append_dev(p1, t8);
    			append_dev(span1, t9);
    			append_dev(span1, p2);
    			append_dev(p2, t10);
    			append_dev(p2, t11);
    			append_dev(span1, t12);
    			append_dev(span1, p3);
    			append_dev(p3, t13);
    			append_dev(p3, t14);
    			append_dev(section, t15);
    			append_dev(section, hr);
    			append_dev(section, t16);
    			append_dev(section, span2);
    			mount_component(button0, span2, null);
    			append_dev(span2, t17);
    			mount_component(button1, span2, null);
    			append_dev(span2, t18);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(span2, null);
    			}

    			append_dev(span2, t19);
    			if (if_block2) if_block2.m(span2, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (!current || dirty & /*logo*/ 2 && !src_url_equal(img.src, img_src_value = /*logo*/ ctx[1])) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (!current || dirty & /*company*/ 1) {
    				attr_dev(img, "alt", /*company*/ ctx[0]);
    			}

    			if (!current || dirty & /*company*/ 1) set_data_dev(t1, /*company*/ ctx[0]);

    			if (/*newPost*/ ctx[2] !== false) {
    				if (if_block0) ; else {
    					if_block0 = create_if_block_2(ctx);
    					if_block0.c();
    					if_block0.m(span0, t3);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (/*featured*/ ctx[3] !== false) {
    				if (if_block1) ; else {
    					if_block1 = create_if_block_1(ctx);
    					if_block1.c();
    					if_block1.m(span0, null);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}

    			if (!current || dirty & /*position*/ 16) set_data_dev(t5, /*position*/ ctx[4]);
    			if (!current || dirty & /*postedAt*/ 128) set_data_dev(t7, /*postedAt*/ ctx[7]);
    			if (!current || dirty & /*contract*/ 256) set_data_dev(t10, /*contract*/ ctx[8]);
    			if (!current || dirty & /*location*/ 512) set_data_dev(t13, /*location*/ ctx[9]);
    			const button0_changes = {};

    			if (dirty & /*$$scope, role*/ 8388640) {
    				button0_changes.$$scope = { dirty, ctx };
    			}

    			button0.$set(button0_changes);
    			const button1_changes = {};

    			if (dirty & /*$$scope, level*/ 8388672) {
    				button1_changes.$$scope = { dirty, ctx };
    			}

    			button1.$set(button1_changes);

    			if (dirty & /*setFilter, languages*/ 5120) {
    				each_value_1 = /*languages*/ ctx[10];
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block_1(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(span2, t19);
    					}
    				}

    				group_outros();

    				for (i = each_value_1.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}

    			if (/*tools*/ ctx[11].length !== 0) {
    				if (if_block2) {
    					if_block2.p(ctx, dirty);

    					if (dirty & /*tools*/ 2048) {
    						transition_in(if_block2, 1);
    					}
    				} else {
    					if_block2 = create_if_block$1(ctx);
    					if_block2.c();
    					transition_in(if_block2, 1);
    					if_block2.m(span2, null);
    				}
    			} else if (if_block2) {
    				group_outros();

    				transition_out(if_block2, 1, 1, () => {
    					if_block2 = null;
    				});

    				check_outros();
    			}

    			if (!current || dirty & /*featured*/ 8 && section_class_value !== (section_class_value = "" + (null_to_empty(/*featured*/ ctx[3] !== false ? "job job--new" : "job") + " svelte-k6a6h"))) {
    				attr_dev(section, "class", section_class_value);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(button0.$$.fragment, local);
    			transition_in(button1.$$.fragment, local);

    			for (let i = 0; i < each_value_1.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			transition_in(if_block2);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(button0.$$.fragment, local);
    			transition_out(button1.$$.fragment, local);
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			transition_out(if_block2);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(section);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    			destroy_component(button0);
    			destroy_component(button1);
    			destroy_each(each_blocks, detaching);
    			if (if_block2) if_block2.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Job', slots, []);
    	let { company } = $$props;
    	let { logo } = $$props;
    	let { newPost } = $$props;
    	let { featured } = $$props;
    	let { position } = $$props;
    	let { role } = $$props;
    	let { level } = $$props;
    	let { postedAt } = $$props;
    	let { contract } = $$props;
    	let { location } = $$props;
    	let { languages } = $$props;
    	let { tools } = $$props;

    	const setFilter = category => {
    		let keyValue = JSON.stringify(Object.values(category));
    		keyValue = keyValue.replace('["', "");
    		keyValue = keyValue.replace('"]', "");

    		filterKeys.update(keys => {
    			if (!keys.includes(keyValue)) {
    				keys = [...keys, keyValue];
    				console.log("filter added");
    			}

    			return [...keys];
    		});
    	};

    	const writable_props = [
    		'company',
    		'logo',
    		'newPost',
    		'featured',
    		'position',
    		'role',
    		'level',
    		'postedAt',
    		'contract',
    		'location',
    		'languages',
    		'tools'
    	];

    	Object_1$2.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1$1.warn(`<Job> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => setFilter({ role });
    	const click_handler_1 = () => setFilter({ level });
    	const click_handler_2 = language => setFilter({ language });
    	const click_handler_3 = tool => setFilter({ tool });

    	$$self.$$set = $$props => {
    		if ('company' in $$props) $$invalidate(0, company = $$props.company);
    		if ('logo' in $$props) $$invalidate(1, logo = $$props.logo);
    		if ('newPost' in $$props) $$invalidate(2, newPost = $$props.newPost);
    		if ('featured' in $$props) $$invalidate(3, featured = $$props.featured);
    		if ('position' in $$props) $$invalidate(4, position = $$props.position);
    		if ('role' in $$props) $$invalidate(5, role = $$props.role);
    		if ('level' in $$props) $$invalidate(6, level = $$props.level);
    		if ('postedAt' in $$props) $$invalidate(7, postedAt = $$props.postedAt);
    		if ('contract' in $$props) $$invalidate(8, contract = $$props.contract);
    		if ('location' in $$props) $$invalidate(9, location = $$props.location);
    		if ('languages' in $$props) $$invalidate(10, languages = $$props.languages);
    		if ('tools' in $$props) $$invalidate(11, tools = $$props.tools);
    	};

    	$$self.$capture_state = () => ({
    		filterKeys,
    		Button,
    		company,
    		logo,
    		newPost,
    		featured,
    		position,
    		role,
    		level,
    		postedAt,
    		contract,
    		location,
    		languages,
    		tools,
    		setFilter
    	});

    	$$self.$inject_state = $$props => {
    		if ('company' in $$props) $$invalidate(0, company = $$props.company);
    		if ('logo' in $$props) $$invalidate(1, logo = $$props.logo);
    		if ('newPost' in $$props) $$invalidate(2, newPost = $$props.newPost);
    		if ('featured' in $$props) $$invalidate(3, featured = $$props.featured);
    		if ('position' in $$props) $$invalidate(4, position = $$props.position);
    		if ('role' in $$props) $$invalidate(5, role = $$props.role);
    		if ('level' in $$props) $$invalidate(6, level = $$props.level);
    		if ('postedAt' in $$props) $$invalidate(7, postedAt = $$props.postedAt);
    		if ('contract' in $$props) $$invalidate(8, contract = $$props.contract);
    		if ('location' in $$props) $$invalidate(9, location = $$props.location);
    		if ('languages' in $$props) $$invalidate(10, languages = $$props.languages);
    		if ('tools' in $$props) $$invalidate(11, tools = $$props.tools);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		company,
    		logo,
    		newPost,
    		featured,
    		position,
    		role,
    		level,
    		postedAt,
    		contract,
    		location,
    		languages,
    		tools,
    		setFilter,
    		click_handler,
    		click_handler_1,
    		click_handler_2,
    		click_handler_3
    	];
    }

    class Job extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {
    			company: 0,
    			logo: 1,
    			newPost: 2,
    			featured: 3,
    			position: 4,
    			role: 5,
    			level: 6,
    			postedAt: 7,
    			contract: 8,
    			location: 9,
    			languages: 10,
    			tools: 11
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Job",
    			options,
    			id: create_fragment$3.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*company*/ ctx[0] === undefined && !('company' in props)) {
    			console_1$1.warn("<Job> was created without expected prop 'company'");
    		}

    		if (/*logo*/ ctx[1] === undefined && !('logo' in props)) {
    			console_1$1.warn("<Job> was created without expected prop 'logo'");
    		}

    		if (/*newPost*/ ctx[2] === undefined && !('newPost' in props)) {
    			console_1$1.warn("<Job> was created without expected prop 'newPost'");
    		}

    		if (/*featured*/ ctx[3] === undefined && !('featured' in props)) {
    			console_1$1.warn("<Job> was created without expected prop 'featured'");
    		}

    		if (/*position*/ ctx[4] === undefined && !('position' in props)) {
    			console_1$1.warn("<Job> was created without expected prop 'position'");
    		}

    		if (/*role*/ ctx[5] === undefined && !('role' in props)) {
    			console_1$1.warn("<Job> was created without expected prop 'role'");
    		}

    		if (/*level*/ ctx[6] === undefined && !('level' in props)) {
    			console_1$1.warn("<Job> was created without expected prop 'level'");
    		}

    		if (/*postedAt*/ ctx[7] === undefined && !('postedAt' in props)) {
    			console_1$1.warn("<Job> was created without expected prop 'postedAt'");
    		}

    		if (/*contract*/ ctx[8] === undefined && !('contract' in props)) {
    			console_1$1.warn("<Job> was created without expected prop 'contract'");
    		}

    		if (/*location*/ ctx[9] === undefined && !('location' in props)) {
    			console_1$1.warn("<Job> was created without expected prop 'location'");
    		}

    		if (/*languages*/ ctx[10] === undefined && !('languages' in props)) {
    			console_1$1.warn("<Job> was created without expected prop 'languages'");
    		}

    		if (/*tools*/ ctx[11] === undefined && !('tools' in props)) {
    			console_1$1.warn("<Job> was created without expected prop 'tools'");
    		}
    	}

    	get company() {
    		throw new Error("<Job>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set company(value) {
    		throw new Error("<Job>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get logo() {
    		throw new Error("<Job>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set logo(value) {
    		throw new Error("<Job>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get newPost() {
    		throw new Error("<Job>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set newPost(value) {
    		throw new Error("<Job>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get featured() {
    		throw new Error("<Job>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set featured(value) {
    		throw new Error("<Job>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get position() {
    		throw new Error("<Job>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set position(value) {
    		throw new Error("<Job>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get role() {
    		throw new Error("<Job>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set role(value) {
    		throw new Error("<Job>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get level() {
    		throw new Error("<Job>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set level(value) {
    		throw new Error("<Job>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get postedAt() {
    		throw new Error("<Job>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set postedAt(value) {
    		throw new Error("<Job>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get contract() {
    		throw new Error("<Job>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set contract(value) {
    		throw new Error("<Job>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get location() {
    		throw new Error("<Job>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set location(value) {
    		throw new Error("<Job>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get languages() {
    		throw new Error("<Job>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set languages(value) {
    		throw new Error("<Job>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get tools() {
    		throw new Error("<Job>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set tools(value) {
    		throw new Error("<Job>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\Components\JobGrid.svelte generated by Svelte v3.49.0 */
    const file$2 = "src\\Components\\JobGrid.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[1] = list[i];
    	return child_ctx;
    }

    // (8:2) {#each jobs as job}
    function create_each_block$1(ctx) {
    	let job;
    	let current;

    	job = new Job({
    			props: {
    				company: /*job*/ ctx[1].company,
    				logo: /*job*/ ctx[1].logo,
    				newPost: /*job*/ ctx[1].new,
    				featured: /*job*/ ctx[1].featured,
    				position: /*job*/ ctx[1].position,
    				role: /*job*/ ctx[1].role,
    				level: /*job*/ ctx[1].level,
    				postedAt: /*job*/ ctx[1].postedAt,
    				contract: /*job*/ ctx[1].contract,
    				location: /*job*/ ctx[1].location,
    				languages: /*job*/ ctx[1].languages,
    				tools: /*job*/ ctx[1].tools
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(job.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(job, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const job_changes = {};
    			if (dirty & /*jobs*/ 1) job_changes.company = /*job*/ ctx[1].company;
    			if (dirty & /*jobs*/ 1) job_changes.logo = /*job*/ ctx[1].logo;
    			if (dirty & /*jobs*/ 1) job_changes.newPost = /*job*/ ctx[1].new;
    			if (dirty & /*jobs*/ 1) job_changes.featured = /*job*/ ctx[1].featured;
    			if (dirty & /*jobs*/ 1) job_changes.position = /*job*/ ctx[1].position;
    			if (dirty & /*jobs*/ 1) job_changes.role = /*job*/ ctx[1].role;
    			if (dirty & /*jobs*/ 1) job_changes.level = /*job*/ ctx[1].level;
    			if (dirty & /*jobs*/ 1) job_changes.postedAt = /*job*/ ctx[1].postedAt;
    			if (dirty & /*jobs*/ 1) job_changes.contract = /*job*/ ctx[1].contract;
    			if (dirty & /*jobs*/ 1) job_changes.location = /*job*/ ctx[1].location;
    			if (dirty & /*jobs*/ 1) job_changes.languages = /*job*/ ctx[1].languages;
    			if (dirty & /*jobs*/ 1) job_changes.tools = /*job*/ ctx[1].tools;
    			job.$set(job_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(job.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(job.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(job, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(8:2) {#each jobs as job}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let section;
    	let current;
    	let each_value = /*jobs*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			section = element("section");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(section, "id", "job-list");
    			add_location(section, file$2, 6, 0, 74);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, section, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(section, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*jobs*/ 1) {
    				each_value = /*jobs*/ ctx[0];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(section, null);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(section);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('JobGrid', slots, []);
    	let { jobs } = $$props;
    	const writable_props = ['jobs'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<JobGrid> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('jobs' in $$props) $$invalidate(0, jobs = $$props.jobs);
    	};

    	$$self.$capture_state = () => ({ Job, jobs });

    	$$self.$inject_state = $$props => {
    		if ('jobs' in $$props) $$invalidate(0, jobs = $$props.jobs);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [jobs];
    }

    class JobGrid extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { jobs: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "JobGrid",
    			options,
    			id: create_fragment$2.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*jobs*/ ctx[0] === undefined && !('jobs' in props)) {
    			console.warn("<JobGrid> was created without expected prop 'jobs'");
    		}
    	}

    	get jobs() {
    		throw new Error("<JobGrid>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set jobs(value) {
    		throw new Error("<JobGrid>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\Components\FilterBox.svelte generated by Svelte v3.49.0 */

    const { Object: Object_1$1, console: console_1 } = globals;
    const file$1 = "src\\Components\\FilterBox.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[3] = list[i];
    	return child_ctx;
    }

    // (24:6) <Button selected={true}         >
    function create_default_slot(ctx) {
    	let t0_value = /*key*/ ctx[3] + "";
    	let t0;
    	let t1;
    	let span;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			t0 = text(t0_value);
    			t1 = space();
    			span = element("span");
    			span.textContent = "X";
    			attr_dev(span, "class", "remove-filter svelte-1mw76jq");
    			add_location(span, file$1, 25, 8, 680);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t0, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, span, anchor);

    			if (!mounted) {
    				dispose = listen_dev(
    					span,
    					"click",
    					function () {
    						if (is_function(/*removeFilter*/ ctx[1]({ key: /*key*/ ctx[3] }))) /*removeFilter*/ ctx[1]({ key: /*key*/ ctx[3] }).apply(this, arguments);
    					},
    					false,
    					false,
    					false
    				);

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty & /*$filterKeys*/ 1 && t0_value !== (t0_value = /*key*/ ctx[3] + "")) set_data_dev(t0, t0_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(span);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot.name,
    		type: "slot",
    		source: "(24:6) <Button selected={true}         >",
    		ctx
    	});

    	return block;
    }

    // (23:4) {#each $filterKeys as key}
    function create_each_block(ctx) {
    	let button;
    	let current;

    	button = new Button({
    			props: {
    				selected: true,
    				$$slots: { default: [create_default_slot] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(button.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(button, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const button_changes = {};

    			if (dirty & /*$$scope, $filterKeys*/ 65) {
    				button_changes.$$scope = { dirty, ctx };
    			}

    			button.$set(button_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(button.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(button.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(button, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(23:4) {#each $filterKeys as key}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let section;
    	let div;
    	let t0;
    	let span;
    	let current;
    	let mounted;
    	let dispose;
    	let each_value = /*$filterKeys*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			section = element("section");
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t0 = space();
    			span = element("span");
    			span.textContent = "Clear";
    			attr_dev(div, "id", "filter-box__keys");
    			attr_dev(div, "class", "svelte-1mw76jq");
    			add_location(div, file$1, 21, 2, 568);
    			attr_dev(span, "id", "filter-box__clear");
    			attr_dev(span, "class", "svelte-1mw76jq");
    			add_location(span, file$1, 30, 2, 798);
    			attr_dev(section, "id", "filter-box");
    			attr_dev(section, "class", "svelte-1mw76jq");
    			add_location(section, file$1, 20, 0, 540);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, section, anchor);
    			append_dev(section, div);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}

    			append_dev(section, t0);
    			append_dev(section, span);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(span, "click", /*click_handler*/ ctx[2], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*removeFilter, $filterKeys*/ 3) {
    				each_value = /*$filterKeys*/ ctx[0];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(div, null);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(section);
    			destroy_each(each_blocks, detaching);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let $filterKeys;
    	validate_store(filterKeys, 'filterKeys');
    	component_subscribe($$self, filterKeys, $$value => $$invalidate(0, $filterKeys = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('FilterBox', slots, []);

    	const removeFilter = key => {
    		let keyValue = JSON.stringify(Object.values(key));
    		keyValue = keyValue.replace('["', "");
    		keyValue = keyValue.replace('"]', "");

    		filterKeys.update(keys => {
    			if (keys.includes(keyValue)) {
    				keys = keys.filter(value => {
    					return value !== keyValue;
    				});

    				console.log("filter removed");
    			}

    			return [...keys];
    		});
    	};

    	const writable_props = [];

    	Object_1$1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1.warn(`<FilterBox> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => set_store_value(filterKeys, $filterKeys = [], $filterKeys);

    	$$self.$capture_state = () => ({
    		filterKeys,
    		Button,
    		removeFilter,
    		$filterKeys
    	});

    	return [$filterKeys, removeFilter, click_handler];
    }

    class FilterBox extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "FilterBox",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* src\App.svelte generated by Svelte v3.49.0 */

    const { Object: Object_1 } = globals;
    const file = "src\\App.svelte";

    // (194:2) {#if showFilterBox === true}
    function create_if_block(ctx) {
    	let filterbox;
    	let current;
    	filterbox = new FilterBox({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(filterbox.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(filterbox, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(filterbox.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(filterbox.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(filterbox, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(194:2) {#if showFilterBox === true}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let header;
    	let t0;
    	let main;
    	let t1;
    	let jobgrid;
    	let current;
    	let if_block = /*showFilterBox*/ ctx[1] === true && create_if_block(ctx);

    	jobgrid = new JobGrid({
    			props: { jobs: /*filteredJobs*/ ctx[0] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			header = element("header");
    			t0 = space();
    			main = element("main");
    			if (if_block) if_block.c();
    			t1 = space();
    			create_component(jobgrid.$$.fragment);
    			attr_dev(header, "class", "svelte-sj2cr6");
    			add_location(header, file, 190, 0, 4716);
    			attr_dev(main, "class", "svelte-sj2cr6");
    			add_location(main, file, 192, 0, 4735);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, header, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, main, anchor);
    			if (if_block) if_block.m(main, null);
    			append_dev(main, t1);
    			mount_component(jobgrid, main, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*showFilterBox*/ ctx[1] === true) {
    				if (if_block) {
    					if (dirty & /*showFilterBox*/ 2) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(main, t1);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}

    			const jobgrid_changes = {};
    			if (dirty & /*filteredJobs*/ 1) jobgrid_changes.jobs = /*filteredJobs*/ ctx[0];
    			jobgrid.$set(jobgrid_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			transition_in(jobgrid.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			transition_out(jobgrid.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(header);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(main);
    			if (if_block) if_block.d();
    			destroy_component(jobgrid);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let $filterKeys;
    	validate_store(filterKeys, 'filterKeys');
    	component_subscribe($$self, filterKeys, $$value => $$invalidate(2, $filterKeys = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);

    	let jobs = [
    		{
    			id: 1,
    			company: "Photosnap",
    			logo: "./images/photosnap.svg",
    			new: true,
    			featured: true,
    			position: "Senior Frontend Developer",
    			role: "Frontend",
    			level: "Senior",
    			postedAt: "1d ago",
    			contract: "Full Time",
    			location: "USA Only",
    			languages: ["HTML", "CSS", "JavaScript"],
    			tools: []
    		},
    		{
    			id: 2,
    			company: "Manage",
    			logo: "./images/manage.svg",
    			new: true,
    			featured: true,
    			position: "Fullstack Developer",
    			role: "Fullstack",
    			level: "Midweight",
    			postedAt: "1d ago",
    			contract: "Part Time",
    			location: "Remote",
    			languages: ["Python"],
    			tools: ["React"]
    		},
    		{
    			id: 3,
    			company: "Account",
    			logo: "./images/account.svg",
    			new: true,
    			featured: false,
    			position: "Junior Frontend Developer",
    			role: "Frontend",
    			level: "Junior",
    			postedAt: "2d ago",
    			contract: "Part Time",
    			location: "USA Only",
    			languages: ["JavaScript"],
    			tools: ["React", "Sass"]
    		},
    		{
    			id: 4,
    			company: "MyHome",
    			logo: "./images/myhome.svg",
    			new: false,
    			featured: false,
    			position: "Junior Frontend Developer",
    			role: "Frontend",
    			level: "Junior",
    			postedAt: "5d ago",
    			contract: "Contract",
    			location: "USA Only",
    			languages: ["CSS", "JavaScript"],
    			tools: []
    		},
    		{
    			id: 5,
    			company: "Loop Studios",
    			logo: "./images/loop-studios.svg",
    			new: false,
    			featured: false,
    			position: "Software Engineer",
    			role: "Fullstack",
    			level: "Midweight",
    			postedAt: "1w ago",
    			contract: "Full Time",
    			location: "Worldwide",
    			languages: ["JavaScript", "Ruby"],
    			tools: ["Sass"]
    		},
    		{
    			id: 6,
    			company: "FaceIt",
    			logo: "./images/faceit.svg",
    			new: false,
    			featured: false,
    			position: "Junior Backend Developer",
    			role: "Backend",
    			level: "Junior",
    			postedAt: "2w ago",
    			contract: "Full Time",
    			location: "UK Only",
    			languages: ["Ruby"],
    			tools: ["RoR"]
    		},
    		{
    			id: 7,
    			company: "Shortly",
    			logo: "./images/shortly.svg",
    			new: false,
    			featured: false,
    			position: "Junior Developer",
    			role: "Frontend",
    			level: "Junior",
    			postedAt: "2w ago",
    			contract: "Full Time",
    			location: "Worldwide",
    			languages: ["HTML", "JavaScript"],
    			tools: ["Sass"]
    		},
    		{
    			id: 8,
    			company: "Insure",
    			logo: "./images/insure.svg",
    			new: false,
    			featured: false,
    			position: "Junior Frontend Developer",
    			role: "Frontend",
    			level: "Junior",
    			postedAt: "2w ago",
    			contract: "Full Time",
    			location: "USA Only",
    			languages: ["JavaScript"],
    			tools: ["Vue", "Sass"]
    		},
    		{
    			id: 9,
    			company: "Eyecam Co.",
    			logo: "./images/eyecam-co.svg",
    			new: false,
    			featured: false,
    			position: "Full Stack Engineer",
    			role: "Fullstack",
    			level: "Midweight",
    			postedAt: "3w ago",
    			contract: "Full Time",
    			location: "Worldwide",
    			languages: ["JavaScript", "Python"],
    			tools: ["Django"]
    		},
    		{
    			id: 10,
    			company: "The Air Filter Company",
    			logo: "./images/the-air-filter-company.svg",
    			new: false,
    			featured: false,
    			position: "Front-end Dev",
    			role: "Frontend",
    			level: "Junior",
    			postedAt: "1mo ago",
    			contract: "Part Time",
    			location: "Worldwide",
    			languages: ["JavaScript"],
    			tools: ["React", "Sass"]
    		}
    	];

    	let showFilterBox;

    	// Creates nested array with objects consisting of just the job values
    	const jobValues = () => {
    		let flattenedJobs = [];

    		Object.keys(jobs).forEach(job => {
    			const values = Object.values(jobs[job]).flat();
    			flattenedJobs = [...flattenedJobs, values];
    		});

    		return flattenedJobs;
    	};

    	const flattenedJobs = jobValues();

    	// Sets jobs based on filters
    	let filteredJobs = [];

    	const writable_props = [];

    	Object_1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		filterKeys,
    		JobGrid,
    		FilterBox,
    		jobs,
    		showFilterBox,
    		jobValues,
    		flattenedJobs,
    		filteredJobs,
    		$filterKeys
    	});

    	$$self.$inject_state = $$props => {
    		if ('jobs' in $$props) $$invalidate(3, jobs = $$props.jobs);
    		if ('showFilterBox' in $$props) $$invalidate(1, showFilterBox = $$props.showFilterBox);
    		if ('filteredJobs' in $$props) $$invalidate(0, filteredJobs = $$props.filteredJobs);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*$filterKeys, filteredJobs*/ 5) {
    			if ($filterKeys.length === 0) {
    				$$invalidate(1, showFilterBox = false);
    				$$invalidate(0, filteredJobs = jobs);
    			} else {
    				$$invalidate(1, showFilterBox = true);
    				$$invalidate(0, filteredJobs = []);

    				Object.keys(jobs).forEach(job => {
    					const hasFilters = $filterKeys.every(key => flattenedJobs[job].includes(key, 0)) && $filterKeys.length !== 0;

    					if (hasFilters) {
    						$$invalidate(0, filteredJobs = [...filteredJobs, jobs[job]]);
    					}
    				});
    			}
    		}
    	};

    	return [filteredJobs, showFilterBox, $filterKeys];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
    	target: document.body
    });

    return app;

})();
//# sourceMappingURL=bundle.js.map
