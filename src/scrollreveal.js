/////    /////    /////    /////
/////    /////    /////    /////
/////    /////    /////    /////
/////    /////    /////    /////
/////             /////    /////
/////             /////    /////
/////    /////    /////    /////
/////    /////    /////    /////
/////    /////
/////    /////
/////    /////    /////    /////
/////    /////    /////    /////
/////    /////    /////    /////
/////    /////    /////    /////

/**
 * ScrollReveal
 * ------------
 * Version : 3.3.6
 * Website : scrollrevealjs.org
 * Repo    : github.com/jlmakes/scrollreveal.js
 * Author  : Julian Lloyd (@jlmakes)
 */

(function() {
	"use strict";
	var sr;
	var _requestAnimationFrame;

	function ScrollReveal(config) {
		// Support instantiation without the `new` keyword.
		// 当作方法调用的支持
		if (
			typeof this === "undefined" ||
			Object.getPrototypeOf(this) !== ScrollReveal.prototype
		) {
			return new ScrollReveal(config);
		}

		sr = this; // Save reference to instance.
		sr.version = "3.3.6";
		sr.tools = new Tools(); // *required utilities 组件中的公共函数的封装

    // g
		if (sr.isSupported()) {
      // 覆盖sr默认配置
			sr.tools.extend(sr.defaults, config || {});

      // 找到sr外部容器
			sr.defaults.container = _resolveContainer(sr.defaults);

      // 元素和容器存储器对象
			sr.store = {
				elements: {},
				containers: []
			};

      // 序列对象
			sr.sequences = {};

			sr.history = [];
			sr.uid = 0;
      // 实例化 false
			sr.initialized = false;
		} else if (typeof console !== "undefined" && console !== null) {
			// Note: IE9 only supports console if devtools are open.
			console.log("ScrollReveal is not supported in this browser.");
		}

		return sr;
	}

	/**
   * Configuration
   * -------------
   * This object signature can be passed directly to the ScrollReveal constructor,
   * or as the second argument of the `reveal()` method.
   */

	ScrollReveal.prototype.defaults = {
		// 'bottom', 'left', 'top', 'right'
		origin: "bottom",

		// Can be any valid CSS distance, e.g. '5rem', '10%', '20vw', etc.
		distance: "20px",

		// Time in milliseconds.
		duration: 500,
		delay: 0,

		// Starting angles in degrees, will transition from these values to 0 in all axes.
		rotate: { x: 0, y: 0, z: 0 },

		// Starting opacity value, before transitioning to the computed opacity.
		opacity: 0,

		// Starting scale value, will transition from this value to 1
		scale: 0.9,

		// Accepts any valid CSS easing, e.g. 'ease', 'ease-in-out', 'linear', etc.
		easing: "cubic-bezier(0.6, 0.2, 0.1, 1)",

		// `<html>` is the default reveal container. You can pass either:
		// DOM Node, e.g. document.querySelector('.fooContainer')
		// Selector, e.g. '.fooContainer'
		container: window.document.documentElement,

		// true/false to control reveal animations on mobile.
		mobile: true,

		// true:  reveals occur every time elements become visible
		// false: reveals occur once as elements become visible
		reset: false,

		// 'always' — delay for all reveal animations
		// 'once'   — delay only the first time reveals occur
		// 'onload' - delay only for animations triggered by first load
		useDelay: "always",

		// Change when an element is considered in the viewport. The default value
		// of 0.20 means 20% of an element must be visible for its reveal to occur.
		// 元素百分比部分可见时才开始动画 缩小动画开始和结束位置
		viewFactor: 0.2,

		// Pixel values that alter the container boundaries.
		// e.g. Set `{ top: 48 }`, if you have a 48px tall fixed toolbar.
		// --
		// Visual Aid: https://scrollrevealjs.org/assets/viewoffset.png
		// 缩小内容展示区域 给边缘留出空间
		viewOffset: { top: 0, right: 0, bottom: 0, left: 0 },

		// Callbacks that fire for each triggered element reveal, and reset.
		beforeReveal: function(domEl) {},
		beforeReset: function(domEl) {},

		// Callbacks that fire for each completed element reveal, and reset.
		afterReveal: function(domEl) {},
		afterReset: function(domEl) {}
	};

	/**
   * Check if client supports CSS Transform and CSS Transition.
   * 检查客户端是否支持transform和transition动画
   * @return {boolean}
   */
	ScrollReveal.prototype.isSupported = function() {
		var style = document.documentElement.style;
		return (
			("WebkitTransition" in style && "WebkitTransform" in style) ||
			("transition" in style && "transform" in style)
		);
	};

	/**
   * Creates a reveal set, a group of elements that will animate when they
   * become visible. If [interval] is provided, a new sequence is created
   * that will ensure elements reveal in the order they appear in the DOM.
   * 创建一个重现集合，当这组元素变得可见的时候动画，提供了间隔时间，创建序列保证元素在dom中有序重现
   *
   * @param {Node|NodeList|string} [target]   The node, node list or selector to use for animation.
   * target 动画的元素
   * @param {Object}               [config]   Override the defaults for this reveal set.
   * config 动画元素默认配置
   * @param {number}               [interval] Time between sequenced element animations (milliseconds).
   * interval 序列动画间隔
   * @param {boolean}              [sync]     Used internally when updating reveals for async content.
   * sync 是否是同步 TODO
   *
   * @return {Object} The current ScrollReveal instance.
   */
	ScrollReveal.prototype.reveal = function(target, config, interval, sync) {
		var container;
		var elements;
		var elem;
		var elemId;
		var sequence;
		var sequenceId;

		// No custom configuration was passed, but a sequence interval instead.
		// let’s shuffle things around to make sure everything works.
		// 修正参数
		if (config !== undefined && typeof config === "number") {
			interval = config;
			config = {};
		} else if (config === undefined || config === null) {
			config = {};
		}

    // 该动画容器
		container = _resolveContainer(config);
    // 该动画元素
		elements = _getRevealElements(target, container);

    // 不存在动画元素 给出提示
		if (!elements.length) {
			console.log(
				'ScrollReveal: reveal on "' + target + '" failed, no elements found.'
			);
			return sr;
		}

		// Prepare a new sequence if an interval is passed.
    // 准备一个新的序列 如果传递了时间间隔
		if (interval && typeof interval === "number") {
			sequenceId = _nextUid();

			sequence = sr.sequences[sequenceId] = {
				id: sequenceId,
				interval: interval,
				elemIds: [],
				active: false
			};
		}

		// Begin main loop to configure ScrollReveal elements.
		// 对这一组序列元素进行循环
		for (var i = 0; i < elements.length; i++) {
			// Check if the element has already been configured and grab it from the store.
			// 当前元素elem对象已经存在 取出 否则新建
			elemId = elements[i].getAttribute("data-sr-id");
			if (elemId) {
				elem = sr.store.elements[elemId];
			} else {
				// Otherwise, let’s do some basic setup.
				elem = {
					id: _nextUid(),
					domEl: elements[i],
					seen: false,
					revealing: false
				};
				elem.domEl.setAttribute("data-sr-id", elem.id);
			}

			// Sequence only setup
			if (sequence) {
				elem.sequence = {
					id: sequence.id,
					index: sequence.elemIds.length
				};

				sequence.elemIds.push(elem.id);
			}

			// New or existing element, it’s time to update its configuration, styles,
			// and send the updates to our store.
			_configure(elem, config, container);
			_style(elem);
			_updateStore(elem);

			// We need to make sure elements are set to visibility: visible, even when
			// on mobile and `config.mobile === false`, or if unsupported.
			if ((sr.tools.isMobile() && !elem.config.mobile) || !sr.isSupported()) {
        // 设置不支持手机或者不支持动画的情况下，动画元素默认可见 不执行动画
				elem.domEl.setAttribute("style", elem.styles.inline);
				elem.disabled = true;
			} else if (!elem.revealing) {
				// Otherwise, proceed normally.
				// 初始化动画元素
				elem.domEl.setAttribute(
					"style",
					elem.styles.inline + elem.styles.transform.initial
				);
			}
		}

		// Each `reveal()` is recorded so that when calling `sync()` while working
		// with asynchronously loaded content, it can re-trace your steps but with
		// all your new elements now in the DOM.

		// Since `reveal()` is called internally by `sync()`, we don’t want to
		// record or intiialize each reveal during syncing.
		// 因为reveal被sync内部调用 所以在sync
		if (!sync && sr.isSupported()) {
			_record(target, config, interval);

			// We push initialization to the event queue using setTimeout, so that we can
			// give ScrollReveal room to process all reveal calls before putting things into motion.
			// --
			// Philip Roberts - What the heck is the event loop anyway? (JSConf EU 2014)
			// https://www.youtube.com/watch?v=8aGhZQkoFbQ
			if (sr.initTimeout) {
				window.clearTimeout(sr.initTimeout);
			}
			sr.initTimeout = window.setTimeout(_init, 0);
		}

		return sr;
	};

	/**
   * Re-runs `reveal()` for each record stored in history, effectively capturing
   * any content loaded asynchronously that matches existing reveal set targets.
   * 对history中存储的记录重新执行reveal
   * @return {Object} The current ScrollReveal instance.
   */
	ScrollReveal.prototype.sync = function() {

		if (sr.history.length && sr.isSupported()) {
			for (var i = 0; i < sr.history.length; i++) {
				var record = sr.history[i];
				sr.reveal(record.target, record.config, record.interval, true);
			}
			_init();
		} else {
			console.log("ScrollReveal: sync failed, no reveals found.");
		}
		return sr;
	};

	/**
   * Private Methods
   * 解析容器 如果不存在设置为documentElement默认容器
   * ---------------
   */

	function _resolveContainer(config) {
		if (config && config.container) {
			if (typeof config.container === "string") {
				return window.document.documentElement.querySelector(config.container);
			} else if (sr.tools.isNode(config.container)) {
				return config.container;
			} else {
				console.log(
					'ScrollReveal: invalid container "' + config.container + '" provided.'
				);
				console.log("ScrollReveal: falling back to default container.");
			}
		}
		return sr.defaults.container;
	}

	/**
   * check to see if a node or node list was passed in as the target,
   * otherwise query the container using target as a selector.
   *
   * @param {Node|NodeList|string} [target]    client input for reveal target.
   * @param {Node}                 [container] parent element for selector queries.
   *
   * @return {array} elements to be revealed.
   */
	function _getRevealElements(target, container) {
		if (typeof target === "string") {
			return Array.prototype.slice.call(container.querySelectorAll(target));
		} else if (sr.tools.isNode(target)) {
			return [target];
		} else if (sr.tools.isNodeList(target)) {
			return Array.prototype.slice.call(target);
		}
		return [];
	}

	/**
   * A consistent way of creating unique IDs.
   * @returns {number}
   */
	function _nextUid() {
		return ++sr.uid;
	}

  // 动画元素container和config修正
	function _configure(elem, config, container) {
		// If a container was passed as a part of the config object,
		// let’s overwrite it with the resolved container passed in.
		if (config.container) config.container = container;
		// If the element hasn’t already been configured, let’s use a clone of the
		// defaults extended by the configuration passed as the second argument.
		if (!elem.config) {
			elem.config = sr.tools.extendClone(sr.defaults, config);
		} else {
			// Otherwise, let’s use a clone of the existing element configuration extended
			// by the configuration passed as the second argument.
			elem.config = sr.tools.extendClone(elem.config, config);
		}

		// Infer CSS Transform axis from origin string.
		// 动画元素方向修正
		if (elem.config.origin === "top" || elem.config.origin === "bottom") {
			elem.config.axis = "Y";
		} else {
			elem.config.axis = "X";
		}
	}

  // 动画元素样式修正
	function _style(elem) {
		var computed = window.getComputedStyle(elem.domEl);

    // 之前没设置过样式
		if (!elem.styles) {
			elem.styles = {
				transition: {},
				transform: {},
				computed: {}
			};

			// Capture any existing inline styles, and add our visibility override.
			// --
			// See section 4.2. in the Documentation:
			// https://github.com/jlmakes/scrollreveal.js#42-improve-user-experience
			// 捕获存在的行内样式 添加我们的可见样式
			elem.styles.inline = elem.domEl.getAttribute("style") || "";
			elem.styles.inline += "; visibility: visible; ";

			// grab the elements existing opacity.
			// 抓去动画元素透明度
			elem.styles.computed.opacity = computed.opacity;

			// grab the elements existing transitions.
			// 抓取动画元素渐变动画
			if (!computed.transition || computed.transition === "all 0s ease 0s") {
				elem.styles.computed.transition = "";
			} else {
				elem.styles.computed.transition = computed.transition + ", ";
			}
		}

		// Create transition styles
		elem.styles.transition.instant = _generateTransition(elem, 0);
		elem.styles.transition.delayed = _generateTransition(
			elem,
			elem.config.delay
		);

		// Generate transform styles, first with the webkit prefix.
		elem.styles.transform.initial = " -webkit-transform:";
		elem.styles.transform.target = " -webkit-transform:";
		_generateTransform(elem);

		// And again without any prefix.
		elem.styles.transform.initial += "transform:";
		elem.styles.transform.target += "transform:";
		_generateTransform(elem);
	}

  // 生成动画元素渐变样式
	function _generateTransition(elem, delay) {
		var config = elem.config;

		return (
			"-webkit-transition: " +
			elem.styles.computed.transition +
			"-webkit-transform " +
			config.duration / 1000 +
			"s " +
			config.easing +
			" " +
			delay / 1000 +
			"s, opacity " +
			config.duration / 1000 +
			"s " +
			config.easing +
			" " +
			delay / 1000 +
			"s; " +
			"transition: " +
			elem.styles.computed.transition +
			"transform " +
			config.duration / 1000 +
			"s " +
			config.easing +
			" " +
			delay / 1000 +
			"s, opacity " +
			config.duration / 1000 +
			"s " +
			config.easing +
			" " +
			delay / 1000 +
			"s; "
		);
	}

  // 生成动画元素transform样式
	function _generateTransform(elem) {
		var config = elem.config;
		var cssDistance;
		var transform = elem.styles.transform;

		// Let’s make sure our our pixel distances are negative for top and left.
		// 修正像素距离本地化
		// e.g. origin = 'top' and distance = '25px' starts at `top: -25px` in CSS.
		if (config.origin === "top" || config.origin === "left") {
			cssDistance = /^-/.test(config.distance)
				? config.distance.substr(1)
				: "-" + config.distance;
		} else {
			cssDistance = config.distance;
		}

		if (parseInt(config.distance)) {
			transform.initial += " translate" + config.axis + "(" + cssDistance + ")";
			transform.target += " translate" + config.axis + "(0)";
		}
		if (config.scale) {
			transform.initial += " scale(" + config.scale + ")";
			transform.target += " scale(1)";
		}
		if (config.rotate.x) {
			transform.initial += " rotateX(" + config.rotate.x + "deg)";
			transform.target += " rotateX(0)";
		}
		if (config.rotate.y) {
			transform.initial += " rotateY(" + config.rotate.y + "deg)";
			transform.target += " rotateY(0)";
		}
		if (config.rotate.z) {
			transform.initial += " rotateZ(" + config.rotate.z + "deg)";
			transform.target += " rotateZ(0)";
		}
		transform.initial += "; opacity: " + config.opacity + ";";
		transform.target += "; opacity: " + elem.styles.computed.opacity + ";";
	}

  // 存储动画容器和动画元素
	function _updateStore(elem) {
		var container = elem.config.container;

		// If this element’s container isn’t already in the store, let’s add it.
		if (container && sr.store.containers.indexOf(container) === -1) {
			sr.store.containers.push(elem.config.container);
		}

		// Update the element stored with our new element.
		sr.store.elements[elem.id] = elem;
	}

	function _record(target, config, interval) {
		// Save the `reveal()` arguments that triggered this `_record()` call, so we
		// can re-trace our steps when calling the `sync()` method.
		var record = {
			target: target,
			config: config,
			interval: interval
		};
		sr.history.push(record);
	}

	function _init() {
		if (sr.isSupported()) {
			// Initial animate call triggers valid reveal animations on first load.
			// Subsequent animate calls are made inside the event handler.
			_animate();

			// Then we loop through all container nodes in the store and bind event
			// listeners to each.
			// 所有已保存的父容器做绑定
			for (var i = 0; i < sr.store.containers.length; i++) {
				sr.store.containers[i].addEventListener("scroll", _handler);
				sr.store.containers[i].addEventListener("resize", _handler);
			}

			// Let’s also do a one-time binding of window event listeners.
			// window做一次绑定
			if (!sr.initialized) {
				window.addEventListener("scroll", _handler);
				window.addEventListener("resize", _handler);
				sr.initialized = true;
			}
		}
		return sr;
	}

	function _handler() {
		_requestAnimationFrame(_animate);
	}

  // 设置有可见元素的序列active为true
	function _setActiveSequences() {
		var active;
		var elem;
		var elemId;
		var sequence;

		// Loop through all sequences
		sr.tools.forOwn(sr.sequences, function(sequenceId) {
			sequence = sr.sequences[sequenceId];
			active = false;

			// For each sequenced elemenet, let’s check visibility and if
			// any are visible, set it’s sequence to active.
			for (var i = 0; i < sequence.elemIds.length; i++) {
				elemId = sequence.elemIds[i];
				elem = sr.store.elements[elemId];
				if (_isElemVisible(elem) && !active) {
					active = true;
				}
			}

			sequence.active = active;
		});
	}

	function _animate() {
		var delayed;
		var elem;

		_setActiveSequences();

		// Loop through all elements in the store
		sr.tools.forOwn(sr.store.elements, function(elemId) {
			elem = sr.store.elements[elemId];
      console.log("elem", elem);
			delayed = _shouldUseDelay(elem);

			// Let’s see if we should revealand if so,
			// trigger the `beforeReveal` callback and
			// determine whether or not to use delay.
      // 动画重现函数
			if (_shouldReveal(elem)) {
				console.log("_shouldReveal");
				elem.config.beforeReveal(elem.domEl);
				if (delayed) {
					elem.domEl.setAttribute(
						"style",
						elem.styles.inline +
							elem.styles.transform.target +
							elem.styles.transition.delayed
					);
				} else {
					elem.domEl.setAttribute(
						"style",
						elem.styles.inline +
							elem.styles.transform.target +
							elem.styles.transition.instant
					);
				}

				// Let’s queue the `afterReveal` callback
				// and mark the element as seen and revealing.
				_queueCallback("reveal", elem, delayed);
				elem.revealing = true;
				elem.seen = true;

				if (elem.sequence) {
					_queueNextInSequence(elem, delayed);
				}
			} else if (_shouldReset(elem)) {
				console.log("_shouldReset");
				//Otherwise reset our element and
				// trigger the `beforeReset` callback.
				elem.config.beforeReset(elem.domEl);
				elem.domEl.setAttribute(
					"style",
					elem.styles.inline +
						elem.styles.transform.initial +
						elem.styles.transition.instant
				);
				// And queue the `afterReset` callback.
				_queueCallback("reset", elem);
				elem.revealing = false;
			}
		});
	}

	function _queueNextInSequence(elem, delayed) {
		var elapsed = 0;
		var delay = 0;
		var sequence = sr.sequences[elem.sequence.id];

		// We’re processing a sequenced element, so let's block other elements in this sequence.
		sequence.blocked = true;

		// Since we’re triggering animations a part of a sequence after animations on first load,
		// we need to check for that condition and explicitly add the delay to our timer.
		if (delayed && elem.config.useDelay === "onload") {
			delay = elem.config.delay;
		}

		// If a sequence timer is already running, capture the elapsed time and clear it.
		if (elem.sequence.timer) {
			elapsed = Math.abs(elem.sequence.timer.started - new Date());
			window.clearTimeout(elem.sequence.timer);
		}

		// Start a new timer.
		elem.sequence.timer = { started: new Date() };
		elem.sequence.timer.clock = window.setTimeout(function() {
			// Sequence interval has passed, so unblock the sequence and re-run the handler.
			sequence.blocked = false;
			elem.sequence.timer = null;
			_handler();
		}, Math.abs(sequence.interval) + delay - elapsed);
	}

	function _queueCallback(type, elem, delayed) {
		var elapsed = 0;
		var duration = 0;
		var callback = "after";

		// Check which callback we’re working with.
		switch (type) {
			case "reveal":
				duration = elem.config.duration;
				if (delayed) {
					duration += elem.config.delay;
				}
				callback += "Reveal";
				break;

			case "reset":
				duration = elem.config.duration;
				callback += "Reset";
				break;
		}

		// If a timer is already running, capture the elapsed time and clear it.
		if (elem.timer) {
			elapsed = Math.abs(elem.timer.started - new Date());
			window.clearTimeout(elem.timer.clock);
		}

		// Start a new timer.
		elem.timer = { started: new Date() };
		elem.timer.clock = window.setTimeout(function() {
			// The timer completed, so let’s fire the callback and null the timer.
			elem.config[callback](elem.domEl);
			elem.timer = null;
		}, duration - elapsed);
	}

	// 检查是否应该重现
	function _shouldReveal(elem) {
		if (elem.sequence) {
			var sequence = sr.sequences[elem.sequence.id];
			return (
				sequence.active &&	// 序列存在动画元素
				!sequence.blocked &&  // 序列是否锁定 因为序列是按照顺序执行所以如果是序列动画必须根据blocked判断前序是否执行完成
				!elem.revealing &&  // 该动画是否已经显示 如果已经显示不做处理
				!elem.disabled  // 该动画是否不可用 根据动画函数函数中设置 (sr.tools.isMobile() && !elem.config.mobile) || !sr.isSupported()
			);
		}
		return _isElemVisible(elem) && !elem.revealing && !elem.disabled;
	}

	// 是否需要transition延时 默认总是需要
	// 生成transition保存着两个样式值
	// 延时 elem.styles.transition.delayed 不延时 elem.styles.transition.instant
	function _shouldUseDelay(elem) {
		var config = elem.config.useDelay;
		return (
			config === "always" ||
			(config === "onload" && !sr.initialized) ||
			(config === "once" && !elem.seen)
		);
	}

	// 是否需要重置默认样式
	// 序列动画非active 序列动画设置有reset 序列动画元素正在显示 序列元素非不可用状态
	// 动画元素不可见 设置有reset 动画元素是显示状态 动画元素非不可用状态
	function _shouldReset(elem) {
		if (elem.sequence) {
			var sequence = sr.sequences[elem.sequence.id];
			return (
				!sequence.active &&
				elem.config.reset &&
				elem.revealing &&
				!elem.disabled
			);
		}
		return (
			!_isElemVisible(elem) &&
			elem.config.reset &&
			elem.revealing &&
			!elem.disabled
		);
	}

	// 返回容器宽和高
	function _getContainer(container) {
		return {
			width: container.clientWidth,
			height: container.clientHeight
		};
	}

  // 获取内容滚动距离 容器滚动距离+容器距离文档顶部距离
	function _getScrolled(container) {
		// Return the container scroll values, plus the its offset.
		if (container && container !== window.document.documentElement) {
			var offset = _getOffset(container);
			return {
				x: container.scrollLeft + offset.left,
				y: container.scrollTop + offset.top
			};
		} else {
			// Otherwise, default to the window object’s scroll values.
			return {
				x: window.pageXOffset,
				y: window.pageYOffset
			};
		}
	}

	// 获取元素距离文档顶部的距离和元素内容宽高
	function _getOffset(domEl) {
		var offsetTop = 0;
		var offsetLeft = 0;

		// Grab the element’s dimensions.
		// 抓取动画元素尺寸
		var offsetHeight = domEl.offsetHeight;
		var offsetWidth = domEl.offsetWidth;

		// Now calculate the distance between the element and its parent, then
		// again for the parent to its parent, and again etc... until we have the
		// total distance of the element to the document’s top and left origin.
		do {
			if (!isNaN(domEl.offsetTop)) {
				offsetTop += domEl.offsetTop;
			}
			if (!isNaN(domEl.offsetLeft)) {
				offsetLeft += domEl.offsetLeft;
			}
			domEl = domEl.offsetParent;
		} while (domEl);

		return {
			top: offsetTop,
			left: offsetLeft,
			height: offsetHeight,
			width: offsetWidth
		};
	}

  // 判断动画元素是否可见
	function _isElemVisible(elem) {
		var offset = _getOffset(elem.domEl);	// 获取元素宽高和文档距离
		var container = _getContainer(elem.config.container);	// 获取动画元素容器
		var scrolled = _getScrolled(elem.config.container);	// 获取动画元素容器距离文档距离和元素内容宽高
		var vF = elem.config.viewFactor;	// 动画元素百分比部分可见 才开始动画

		// Define the element geometry.
		// 定义元素坐标
		var elemHeight = offset.height;
		var elemWidth = offset.width;
		var elemTop = offset.top;
		var elemLeft = offset.left;
    // 元素底部距离文档顶部距离
		var elemBottom = elemTop + elemHeight;
    // 元素右侧距离文档左侧距离
		var elemRight = elemLeft + elemWidth;

		return confirmBounds() || isPositionFixed();

		function confirmBounds() {
			// Define the element’s functional boundaries using its view factor.
			// 元素显示的上界限
			var top = elemTop + elemHeight * vF;
			// 元素显示的左界限
			var left = elemLeft + elemWidth * vF;
			// 元素显示的下界限
			var bottom = elemBottom - elemHeight * vF;
			// 元素显示的右界限
			var right = elemRight - elemWidth * vF;

			// Define the container functional boundaries using its view offset.
			// 当前屏幕顶部到文档顶部距离
			var viewTop = scrolled.y + elem.config.viewOffset.top;
			// 当前屏幕左侧到文档顶部距离
			var viewLeft = scrolled.x + elem.config.viewOffset.left;
			// 当前屏幕底部到文档顶部距离
			var viewBottom =
				scrolled.y - elem.config.viewOffset.bottom + container.height;
			var viewRight =
				scrolled.x - elem.config.viewOffset.right + container.width;
			return (
				top < viewBottom &&
				bottom > viewTop &&
				left < viewRight &&
				right > viewLeft
			);
		}

		function isPositionFixed() {
			return window.getComputedStyle(elem.domEl).position === "fixed";
		}
	}

	/**
   * Utilities
   * ---------
   */

	function Tools() {}

	// 判断参数是否为字面量对象
	Tools.prototype.isObject = function(object) {
		return (
			object !== null &&
			typeof object === "object" &&
			object.constructor === Object
		);
	};

	// 判断传入对象是否为node节点 TODO IE window.Node === "object"
	Tools.prototype.isNode = function(object) {
		return typeof window.Node === "object"
			? object instanceof window.Node
			: object &&
					typeof object === "object" &&
					typeof object.nodeType === "number" &&
					typeof object.nodeName === "string";
	};

	// 判断是否是node list object prototypeToString：HTMLCollection
	Tools.prototype.isNodeList = function(object) {
		var prototypeToString = Object.prototype.toString.call(object);
		var regex = /^\[object (HTMLCollection|NodeList|Object)\]$/;

		return typeof window.NodeList === "object"
			? object instanceof window.NodeList
			: object &&
					typeof object === "object" &&
					regex.test(prototypeToString) &&
					typeof object.length === "number" &&
					(object.length === 0 || this.isNode(object[0]));
	};

	// 循环对象属性
	Tools.prototype.forOwn = function(object, callback) {
		if (!this.isObject(object)) {
			throw new TypeError(
				'Expected "object", but received "' + typeof object + '".'
			);
		} else {
			for (var property in object) {
				if (object.hasOwnProperty(property)) {
					callback(property);
				}
			}
		}
	};

	// 对象属性继承
	Tools.prototype.extend = function(target, source) {
		this.forOwn(
			source,
			function(property) {
				if (this.isObject(source[property])) {
					if (!target[property] || !this.isObject(target[property])) {
						target[property] = {};
					}
					this.extend(target[property], source[property]);
				} else {
					target[property] = source[property];
				}
			}.bind(this)
		);
		return target;
	};

	// 继承 初始化字面量对象
	Tools.prototype.extendClone = function(target, source) {
		return this.extend(this.extend({}, target), source);
	};

	// 是否是手机判断
	Tools.prototype.isMobile = function() {
		return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
			navigator.userAgent
		);
	};

	/**
   * Polyfills
   * --------
   */

  // 动画补充
	_requestAnimationFrame =
		window.requestAnimationFrame ||
		window.webkitRequestAnimationFrame ||
		window.mozRequestAnimationFrame ||
		function(callback) {
			window.setTimeout(callback, 1000 / 60);
		};

	/**
   * Module Wrapper
   * --------------
   */
	if (
		typeof define === "function" &&
		typeof define.amd === "object" &&
		define.amd
	) {
		define(function() {
			return ScrollReveal;
		});
	} else if (typeof module !== "undefined" && module.exports) {
		module.exports = ScrollReveal;
	} else {
		window.ScrollReveal = ScrollReveal;
	}
})();
