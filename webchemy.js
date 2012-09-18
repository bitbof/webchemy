/*
	Webchemy - Alchemy for the web
	Copyright (C) 2012 bitbof (http://bitbof.com)

	This program is free software: you can redistribute it and/or modify
	it under the terms of the GNU General Public License as published by
	the Free Software Foundation, either version 3 of the License, or
	(at your option) any later version.

	This program is distributed in the hope that it will be useful,
	but WITHOUT ANY WARRANTY; without even the implied warranty of
	MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
	GNU General Public License for more details.

	You should have received a copy of the GNU General Public License
	along with this program.  If not, see <http://www.gnu.org/licenses/.
*/
/*	
	USES: filesaver.js - can be loaded later on
	
	USING WEBCHEMY:
	
	//add to page ... fullscreen
	var wc = new Webchemy();
	
	//get image or svg manually
	var canvas = wc.getCanvas();
	var svg = wc.getSVGString();
	
	//add to page, not fullscreen
	var wc = new Webchemy({target: someDiv, width: 800, height: 600});
	//resize
	wc.resize(500, 300);
	
	Also if it runs on mobile, this makes sense: <meta name="viewport" content="width=device-width; initial-scale=1.0; maximum-scale=1.0; user-scalable=0;" />
*/
var Webchemy = (function () {
	"use strict";
	var UI = {}, LIB = {}, requestAnimFrame;
	requestAnimFrame = (function () {
		return window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame || function (callback) {
			window.setTimeout(callback, 1000 / 60);
		};
	}());
	/*LIB.addCssRule(selector, declaration)
	Add css rule(declaration) for a class, id, etc.(selector)
	selector {
		declaration
	}
	*/
	LIB.addCssRule = (function () {
		var style_node = document.createElement("style");
		style_node.setAttribute("type", "text/css");
		style_node.setAttribute("media", "screen");
		document.getElementsByTagName("head")[0].appendChild(style_node);
		return function (selector, declaration) {
			var ua, isIE, last_style_node;
			ua = navigator.userAgent.toLowerCase();
			isIE = (navigator.appName === 'Microsoft Internet Explorer');
			if (!isIE) {
				style_node.appendChild(document.createTextNode(selector + " {" + declaration + "}"));
			}
			if (isIE && document.styleSheets && document.styleSheets.length > 0) {
				last_style_node = document.styleSheets[document.styleSheets.length - 1];
				last_style_node.addRule(selector, declaration);
			}
		};
	}());
	/*LIB.css(el, style)
	assign multiple style rules to one element
	example:
	LIB.css(someDiv, {
		border: "1px solid #00f",
		margin: "10px"
	});
	*/
	LIB.css = function (el, style) {
		var i;
		for (i in style) {
			if (style.hasOwnProperty(i)) {
				if (i === "transform") {
					el.style.WebkitTransform = style[i];
					el.style.MozTransform = style[i];
					el.style.OTransform = style[i];
					el.style.msTransform = style[i];
				} else if (i === "transformOrigin") {
					el.style.WebkitTransformOrigin = style[i];
					el.style.MozTransformOrigin = style[i];
					el.style.OTransformOrigin = style[i];
					el.style.msTransformOrigin = style[i];
				} else if (i === "transition") {
					el.style.WebkitTransition = style[i];
					el.style.MozTransition = style[i];
					el.style.OTransition = style[i];
					el.style.msTransition = style[i];
				} else {
					el.style[i] = style[i];
				}
			}
		}
	};
	/*LIB.spawnGlow(x, y, (parent))
	Animates a glow effect, useful for touch events (good visual feedback)
	*/
	LIB.spawnGlow = (function () {
		//preload glowing effect
		var glowIm = new Image();
		glowIm.src = "glow.png";
		return function (x, y, parent) {
			var glow, prnt;
			glow = new Image();
			glow.src = "glow.png";
			LIB.css(glow, {
				position: "absolute",
				left: (x - 64) + "px",
				top: (y - 64) + "px",
				width: "128px",
				height: "128px",
				transition: "opacity 0.2s linear",
				pointerEvents: "none"
			});
			prnt = document.body;
			if (parent) {
				prnt = parent;
			}
			prnt.appendChild(glow);
			setTimeout(function () {
				LIB.css(glow, {
					opacity: "0"
				});
				setTimeout(function () {
					prnt.removeChild(glow);
				}, 200);
			}, 30);
		};
	}());
	/*LIB.color
	Basic color operations
	c is either {r: (0-255), g: (0-255), b: (0-255)} or {h: (0-360), s: (0-100), v: (0-100)}
	*/
	LIB.color = {
		rgbToHsv: function (c) {
			var result, r, g, b, minVal, maxVal, delta, del_R, del_G, del_B;
			c.r = Math.max(0, Math.min(255, c.r));
			c.g = Math.max(0, Math.min(255, c.g));
			c.b = Math.max(0, Math.min(255, c.b));
			result = {
				h: 0,
				s: 0,
				v: 0
			};
			r = c.r / 255;
			g = c.g / 255;
			b = c.b / 255;
			minVal = Math.min(r, g, b);
			maxVal = Math.max(r, g, b);
			delta = maxVal - minVal;
			result.v = maxVal;
			if (delta === 0) {
				result.h = 0;
				result.s = 0;
			} else {
				result.s = delta / maxVal;
				del_R = (((maxVal - r) / 6) + (delta / 2)) / delta;
				del_G = (((maxVal - g) / 6) + (delta / 2)) / delta;
				del_B = (((maxVal - b) / 6) + (delta / 2)) / delta;
				if (r === maxVal) {
					result.h = del_B - del_G;
				} else if (g === maxVal) {
					result.h = (1 / 3) + del_R - del_B;
				} else if (b === maxVal) {
					result.h = (2 / 3) + del_G - del_R;
				}
				if (result.h < 0) {
					result.h += 1;
				}
				if (result.h > 1) {
					result.h -= 1;
				}
			}
			result.h = Math.round(result.h * 360);
			result.s = Math.round(result.s * 100);
			result.v = Math.round(result.v * 100);
			return result;
		},
		hsvToRgb: function (c) {
			var result, h, s, v, var_h, var_i, var_1, var_2, var_3, var_r, var_g, var_b;
			c.h = Math.max(0, Math.min(360, c.h));
			c.s = Math.max(0.001, Math.min(100, c.s)); //bug if 0
			c.v = Math.max(0, Math.min(100, c.v));
			result = {
				r: 0,
				g: 0,
				b: 0
			};
			h = c.h / 360;
			s = c.s / 100;
			v = c.v / 100;
			if (s === 0) {
				result.r = v * 255;
				result.g = v * 255;
				result.b = v * 255;
			} else {
				var_h = h * 6;
				var_i = Math.floor(var_h);
				var_1 = v * (1 - s);
				var_2 = v * (1 - s * (var_h - var_i));
				var_3 = v * (1 - s * (1 - (var_h - var_i)));
				if (var_i === 0) {
					var_r = v;
					var_g = var_3;
					var_b = var_1;
				} else if (var_i === 1) {
					var_r = var_2;
					var_g = v;
					var_b = var_1;
				} else if (var_i === 2) {
					var_r = var_1;
					var_g = v;
					var_b = var_3;
				} else if (var_i === 3) {
					var_r = var_1;
					var_g = var_2;
					var_b = v;
				} else if (var_i === 4) {
					var_r = var_3;
					var_g = var_1;
					var_b = v;
				} else {
					var_r = v;
					var_g = var_1;
					var_b = var_2;
				}
				result.r = var_r * 255;
				result.g = var_g * 255;
				result.b = var_b * 255;
				result.r = Math.round(result.r);
				result.g = Math.round(result.g);
				result.b = Math.round(result.b);
			}
			return result;
		},
		rgbToHex: function (c) {
			var ha, hb, hc;
			ha = (parseInt(c.r, 10)).toString(16);
			hb = (parseInt(c.g, 10)).toString(16);
			hc = (parseInt(c.b, 10)).toString(16);

			function fillUp(p) {
				if (p.length === 1) {
					p = "0" + p;
				}
				return p;
			}
			return "#" + fillUp(ha) + fillUp(hb) + fillUp(hc);
		}
	};
	/*LIB.getGlobalOff(el)
	Returns offset({x: , y: }) of DOM element to the origin of the page
	*/
	LIB.getGlobalOff = function (el) {
		var result, oElement;
		result = {
			x: 0,
			y: 0
		};
		oElement = el;
		while (oElement !== null) {
			result.x += oElement.offsetLeft;
			result.y += oElement.offsetTop;
			oElement = oElement.offsetParent;
		}
		return result;
	};
	/*LIB.loadImageToDataURL(p)
	P = {src: <string>, callback: <function(strDataURL)>}
	Takes url of image and returns DataURL of that image via callback
	*/
	LIB.loadImageToDataURL = function (p) {
		var callback, src, im;
		callback = p.callback;
		src = p.src;
		im = new Image();
		im.onload = function () {
			var canvas = document.createElement("canvas");
			canvas.width = im.width;
			canvas.height = im.height;
			canvas.getContext("2d").drawImage(im, 0, 0);
			callback(canvas.toDataURL("image/png"));
		};
		im.src = src;
	};
	/*LIB.attachMouseListener(element, callback)
	Sends all mouseevents(move, drag, down, release, touch, scrollwheel) back via callback on AnimationFrame.
	What you get in the callback:
	event = {
		event:			Original event
		x: (0.0-1.0)	Position inside element
		y: (0.0-1.0)	Position inside element
		absX:			Position in px, element is the origin
		absY:			Position in px, element is the origin
		over:			True on mouseover else undefined
		out:			True on mouseout else undefined
		out:			True on mousedown else undefined
		code:			Buttoncode
		dragdone:		True/false when dragging, else undefined
		dX:				Delta x since last event in px, ONLY when dragging
		dY:				Delta y since last event in px, ONLY when dragging
		touch:			True when using touch
		delta:			+/-0 ScrollWheel
	}
	*/
	LIB.attachMouseListener = function (p_el, p_callback) {
		var el, callback, requested, inputData, wheel;
		if (!p_el || !p_callback) {
			return false;
		}
		el = p_el;
		callback = p_callback;
		//should work since it's just one thread
		requested = false;
		inputData = [];

		function handleInput() {
			var input;
			while (inputData.length > 0) {
				input = inputData.shift();
				callback(input);
			}
			requested = false;
		}

		function push(p) {
			inputData.push(p);
			if (!requested) {
				requestAnimFrame(handleInput);
				requested = true;
			}
		}

		function limit(val) {
			return Math.max(0, Math.min(1, val));
		}
		el.onmouseover = function (event) {
			var width, height, offset, x, y;
			if (document.onmousemove) {
				return false;
			}
			width = el.offsetWidth;
			height = el.offsetHeight;
			offset = LIB.getGlobalOff(el);
			x = event.pageX - offset.x;
			y = event.pageY - offset.y;
			push({
				event: event,
				x: limit(x / width),
				y: limit(y / height),
				over: true,
				absX: x,
				absY: y
			});
			return false;
		};
		el.onmouseout = function (event) {
			var width, height, offset, x, y;
			if (document.onmousemove) {
				return false;
			}
			width = el.offsetWidth;
			height = el.offsetHeight;
			offset = LIB.getGlobalOff(el);
			x = event.pageX - offset.x;
			y = event.pageY - offset.y;
			push({
				event: event,
				x: limit(x / width),
				y: limit(y / height),
				out: true,
				absX: x,
				absY: y
			});
			return false;
		};
		el.onmousemove = function (event) {
			var width, height, offset, x, y;
			if (document.onmousemove) {
				return false;
			}
			width = el.offsetWidth;
			height = el.offsetHeight;
			offset = LIB.getGlobalOff(el);
			x = event.pageX - offset.x;
			y = event.pageY - offset.y;
			push({
				event: event,
				x: limit(x / width),
				y: limit(y / height),
				move: true,
				absX: x,
				absY: y
			});
			return false;
		};
		el.onmousedown = function (event) {
			var width, height, offset, x, y, lastX, lastY, buttoncode;
			width = el.offsetWidth;
			height = el.offsetHeight;
			offset = LIB.getGlobalOff(el);
			x = event.pageX - offset.x;
			y = event.pageY - offset.y;
			lastX = x;
			lastY = y;
			buttoncode = event.button;
			push({
				event: event,
				x: limit(x / width),
				y: limit(y / height),
				dragdone: false,
				absX: x,
				absY: y,
				code: buttoncode,
				dX: 0,
				dY: 0,
				down: true
			});
			document.onmousemove = function (event) {
				x = event.pageX - offset.x;
				y = event.pageY - offset.y;
				push({
					event: event,
					x: limit(x / width),
					y: limit(y / height),
					dragdone: false,
					absX: x,
					absY: y,
					code: buttoncode,
					dX: x - lastX,
					dY: y - lastY,
					pageX: event.pageX,
					pageY: event.pageY
				});
				lastX = x;
				lastY = y;
				return false;
			};
			document.onmouseup = function (event) {
				push({
					event: event,
					x: limit(x / width),
					y: limit(y / height),
					dragdone: true,
					absX: x,
					absY: y,
					code: buttoncode
				});
				document.onmousemove = undefined;
				document.onmouseup = undefined;
				return false;
			};
			return false;
		};
		el.ontouchstart = function (event) {
			var offset, x, y, lastX, lastY, width, height;
			if (event.touches.length !== 1) {
				return;
			}
			offset = LIB.getGlobalOff(el);
			x = event.touches[0].pageX - offset.x;
			y = event.touches[0].pageY - offset.y;
			lastX = x;
			lastY = y;
			width = el.offsetWidth;
			height = el.offsetHeight;
			push({
				event: event,
				x: limit(x / width),
				y: limit(y / height),
				dragdone: false,
				absX: x,
				absY: y,
				code: 0,
				down: true,
				dX: 0,
				dY: 0,
				touch: true
			});
			document.ontouchmove = function (event) {
				if (event.touches.length !== 1) {
					return;
				}
				x = event.touches[0].pageX - offset.x;
				y = event.touches[0].pageY - offset.y;
				push({
					event: event,
					x: limit(x / width),
					y: limit(y / height),
					dragdone: false,
					absX: x,
					absY: y,
					code: 0,
					dX: x - lastX,
					dY: y - lastY,
					touch: true
				});
				lastX = x;
				lastY = y;
				return false;
			};
			document.ontouchend = function (event) {
				push({
					event: event,
					x: limit(x / width),
					y: limit(y / height),
					dragdone: true,
					absX: x,
					absY: y,
					code: 0,
					dX: x - lastX,
					dY: y - lastY,
					touch: true
				});
				document.ontouchmove = undefined;
				document.ontouchend = undefined;
				return false;
			};
			return false;
		};
		wheel = function (event) {
			var delta, width, height, offset, x, y;
			delta = 0;
			if (!event) {
				event = window.event;
			}
			if (event.wheelDelta) {
				delta = event.wheelDelta / 120;
			} else if (event.detail) {
				delta = -event.detail / 3;
			}
			width = el.offsetWidth;
			height = el.offsetHeight;
			offset = LIB.getGlobalOff(el);
			x = event.pageX - offset.x;
			y = event.pageY - offset.y;
			push({
				event: event,
				x: limit(x / width),
				y: limit(y / height),
				delta: delta,
				absX: x,
				absY: y
			});
		};
		el.onmousewheel = wheel;
		el.addEventListener('DOMMouseScroll', wheel, false);
		return true;
	};
	/*LIB.BezierLine
	Figures out additional control points that create a fairly smooth and natural line in real time(as you add points)
	add(x, y) add a point
	getPoints() returns you all points with additional control points between them like this:
	[{x:, y: , c1: {x: , y: }, c2: {x: , y: }, c3: next}, next, ...]
	The last element of the array doesn't have c1, c2 and c3
	*/
	LIB.BezierLine = function () {
		var points, lastPoint;
		points = [];
		this.add = function (x, y) {
			var a, b;
			if (lastPoint && x === lastPoint.x && y === lastPoint.y) {
				return;
			}
			lastPoint = {
				x: x,
				y: y
			};
			points[points.length] = {
				x: x,
				y: y
			};
			if (points.length === 1) {
				return;
			}
			if (points.length === 2) {
				points[0].dir = LIB.Vec2.nor(LIB.Vec2.sub(points[1], points[0]));
				return;
			}
			points[points.length - 2].dir = LIB.Vec2.nor(LIB.Vec2.sub(points[points.length - 1], points[points.length - 3]));
			a = points[points.length - 3];
			b = points[points.length - 2];
			a.c1 = LIB.Vec2.add(a, LIB.Vec2.mul(a.dir, LIB.Vec2.dist(a, b) / 4));
			a.c2 = LIB.Vec2.sub(b, LIB.Vec2.mul(b.dir, LIB.Vec2.dist(a, b) / 4));
			a.c3 = {
				x: b.x,
				y: b.y
			};
		};
		this.getPoints = function () {
			var out;
			if (points.length < 3) {
				return [];
			}
			out = points;
			/*
			//displace modifier...gradients need to be recalculated for this to work nicely or use LIB.drawSVGToContext
			var waggle = 10;
			var freq = 2;
			var subwaggle = 0;
			var lastrand = Math.random()-0.5;
			var lastrand2 = Math.random()-0.5;
			for(var i = 0; i < points.length; i += 1) {
				subwaggle = waggle;// * Math.cos(points.length*0.06);
				var xy = LIB.Vec2.add(out[i], LIB.Vec2.mul({x:Math.cos((points.length+i)/freq) + lastrand, y: Math.cos((points.length+i)/freq) + lastrand2}, subwaggle));
				out[i].x = xy.x;
				out[i].y = xy.y;
				lastrand = Math.random()-0.5;
				lastrand2 = Math.random()-0.5;
				if(points[i].c1 !== undefined) {
					out[i].c1 = LIB.Vec2.add(out[i].c1, LIB.Vec2.mul({x:Math.cos((points.length+(i + 1/3))/freq) + lastrand, y: Math.cos((points.length+(i + 1/3))/freq) + lastrand2}, subwaggle));
				}
				lastrand = Math.random()-0.5;
				lastrand2 = Math.random()-0.5;
				if(points[i].c2 !== undefined) {
					out[i].c2 = LIB.Vec2.add(out[i].c2, LIB.Vec2.mul({x:Math.cos((points.length+(i + 2/3))/freq) + lastrand, y: Math.cos((points.length+(i + 2/3))/freq) + lastrand2}, subwaggle));
				}
				lastrand = Math.random()-0.5;
				lastrand2 = Math.random()-0.5;
				if(points[i].c3 !== undefined) {
					out[i].c3 = LIB.Vec2.add(out[i].c3, LIB.Vec2.mul({x:Math.cos((points.length+(i + 3/3))/freq) + lastrand, y: Math.cos((points.length+(i + 3/3))/freq) + lastrand2}, subwaggle));
				}
			}*/
			return out;
		};
	};
	/*LIB.drawSVGToContext(p)
	A non manual way of drawing SVG shapes onto a canvas. Should yield more accurate results since
	the browser knows best how to draw SVG shapes.
	Works with Chrome. Some issues with Firefox. Doesn't really work with other browsers yet.
	Not sure how much overhead it causes(Blob, ObjectURL, Image,...).
	I would prefer having this as part of the canvas API: context.drawSVG(svgString or svgElement, 0, 0);
	p = {
		width: <number>			Width of the SVG viewport
		height: <number>		Height of the SVG viewport
		defs: <string>			Everything inside <defs>...</defs>
		shapes: <string>		Everything that follows <defs>
		context:				Context of the canvas you wish to draw on
		callback: <function()>	Gets called when the SVG is ready to be painted onto the canvas
	}
	*/
	LIB.drawSVGToContext = function (p) {
		var width, height, shapes, defs, context, callback, svgStart, svgString, DOMURL, blob, url, img;
		width = p.width;
		height = p.height;
		shapes = p.shapes;
		defs = p.defs;
		context = p.context;
		callback = p.callback;
		svgStart = '<?xml version="1.0" encoding="UTF-8" standalone="no"?> \n' + '<svg \n' + 'xmlns:dc="http://purl.org/dc/elements/1.1/" \n' + 'xmlns:cc="http://creativecommons.org/ns#" \n' + 'xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" \n' + 'xmlns:svg="http://www.w3.org/2000/svg" \n' + 'xmlns="http://www.w3.org/2000/svg" \n' + 'xmlns:xlink="http://www.w3.org/1999/xlink" \n' + 'width="' + width + '" \n' + 'height="' + height + '" \n' + 'id="svg3112" \n' + 'version="1.1">';
		svgString = svgStart + "<defs>" + defs + "</defs>" + shapes + "</svg>";
		DOMURL = window.URL || window.webkitURL || window;
		blob = new window.Blob([svgString], {
			"type": "image/svg+xml;charset=utf-8"
		});
		url = DOMURL.createObjectURL(blob);
		img = new Image();
		img.onload = function () {
			callback();
			context.drawImage(img, 0, 0);
			DOMURL.revokeObjectURL(url);
		};
		img.src = url;
	};
	/*LIB.Vec2
	Basic vector operations. Parameters and results are usually {x: , y: }
	*/
	LIB.Vec2 = {
		add: function (p1, p2) {
			return {
				x: p1.x + p2.x,
				y: p1.y + p2.y
			};
		},
		sub: function (p1, p2) {
			return {
				x: p1.x - p2.x,
				y: p1.y - p2.y
			};
		},
		nor: function (p) {
			var len = Math.sqrt(Math.pow(p.x, 2) + Math.pow(p.y, 2));
			if (len === 0) {
				return {
					x: 0,
					y: 0
				};
			}
			return {
				x: p.x / len,
				y: p.y / len
			};
		},
		len: function (p) {
			return Math.sqrt(Math.pow(p.x, 2) + Math.pow(p.y, 2));
		},
		dist: function (p1, p2) {
			return LIB.Vec2.len(LIB.Vec2.sub(p1, p2));
		},
		mul: function (p, s) {
			return {
				x: p.x * s,
				y: p.y * s
			};
		}
	};
	/*UI.theme
	Defining grid size, colors, tile coordinates, etc. for all the UI elements
	*/
	UI.theme = {
		halfBoxSize: 22,
		barCol: "#777",
		expandCol: "#555",
		bgCol: "#444",
		textColor: "#fff",
		labelColor: "#ccc",
		linkColor: "#83d1e9",
		linkHoverColor: "#b2edff",
		opacityOff: 0.4,
		buttonSVG: "icons.svg",
		svgGrid: [ //name, i, e
			["btn_undo.svg", 0, 0],
			["btn_redo.svg", 1, 0],
			["btn_hand.svg", 2, 0],
			["btn_zoomIn.svg", 3, 0],
			["btn_zoomOut.svg", 4, 0],
			["btn_about.svg", 5, 0],
			["btn_brushFill.svg", 6, 1],
			["btn_brushStroke.svg", 0, 2],
			["btn_modifiers.svg", 1, 2],
			["btn_more.svg", 2, 2],
			["btn_clear.svg", 3, 2],
			["btn_export.svg", 4, 2],
			["btn_fill.svg", 5, 2],
			["btn_stroke.svg", 6, 2],
			["btn_gradientUp.svg", 0, 1],
			["btn_flipHor.svg", 1, 1],
			["btn_flipVert.svg", 2, 1],
			["btn_splat.svg", 4, 1]
		]
	};
	/*UI.Button(p)
	Basic button
	P =	{
		im: <string>			Icon from UI.theme.svgGrid. Example: "btn_clear.svg"
		text: <string>			The alternative to an image
		animated: <boolean>,	Animates on pressing
		disabled: <boolean>,	Disable/enable button
		touchGlow: <boolean>,	Glow effect on touch
		callback: <function()>	Gets called when pressed.
	}
	enable(<boolean>)			Enable/disable button
	setTouchGlow(<boolean>)		Enable/disable touch glow effect
	setImage(<string>)			Change icon
	getDiv()					Returns div element of button
	isEnabled()
	*/
	UI.Button = function (p) {
		var im, text, animated, disabled, touchGlow, callback, boxSize, div, innerDiv, bgScale, i, e, h,
			borderSize, scaleX, scaleY, offx, offy;
		im = p.im;
		text = p.text;
		animated = p.animated || false;
		disabled = p.disabled || false;
		touchGlow = p.touchGlow || false;
		callback = p.callback;
		boxSize = 2 * UI.theme.halfBoxSize;
		div = document.createElement("div");
		innerDiv = document.createElement("div");

		function updateBackground() {
			bgScale = 0.75;
			i = 0;
			e = 0;
			for (h = 0; h < UI.theme.svgGrid.length; h += 1) {
				if (im === UI.theme.svgGrid[h][0]) {
					i = UI.theme.svgGrid[h][1];
					e = UI.theme.svgGrid[h][2];
					break;
				}
			}
			borderSize = (1 - bgScale) * boxSize * 0.5;
			scaleX = (boxSize * bgScale) * (7 * 3);
			scaleY = (boxSize * bgScale) * (3 * 3);
			offx = -(boxSize * bgScale * 3 * i) + borderSize;
			offy = (boxSize * bgScale * 3 * e) - (scaleY - boxSize) - borderSize;
			LIB.css(innerDiv, {
				backgroundSize: scaleX + "px " + scaleY + "px ",
				backgroundRepeat: "no-repeat",
				backgroundPosition: offx + "px " + offy + "px",
				width: boxSize + "px",
				height: boxSize + "px"
			});
		}
		if (im) {
			LIB.css(innerDiv, {
				background: "url(" + UI.theme.buttonSVG + ")"
			});
			updateBackground();
		} else if (text) {
			LIB.css(innerDiv, {
				fontSize: (boxSize / 3.0) + "px",
				paddingTop: (boxSize / 3.5) + "px",
				height: "",
				textAlign: "center",
				fontWeight: "bold"
			});
			innerDiv.innerHTML = text;
		}
		div.appendChild(innerDiv);
		function click() {
			if (disabled) {
				return;
			}
			callback();
			if (animated) {
				LIB.css(innerDiv, {
					transition: "",
					transform: "scale(0.9, 0.9)"
				});
				setTimeout(function () {
					LIB.css(innerDiv, {
						transform: "",
						transition: "all 0.1s ease-in"
					});
					setTimeout(function () {
						LIB.css(innerDiv, {
							transition: ""
						});
					}, 110);
				}, 10);
			}
		}
		div.onmousedown = function () {
			click();
		};
		div.ontouchstart = function (event) {
			var off;
			div.onmousedown = function () {};
			if (event.touches.length !== 1) {
				return false;
			}
			if (!disabled) {
				if (touchGlow) {
					off = LIB.getGlobalOff(div);
					LIB.spawnGlow(off.x + boxSize / 2, off.y + boxSize / 2);
				}
			}
			click();
			return false;
		};
		//style
		LIB.css(div, {
			width: boxSize + "px",
			height: boxSize + "px",
			cssFloat: "left",
			cursor: "pointer",
			transition: "background 0.1s ease-in"
		});
		if (disabled) {
			LIB.css(div, {
				opacity: UI.theme.opacityOff,
				cursor: "default"
			});
		}
		if (p.style) {
			LIB.css(div, p.style);
		}
		//interface
		this.enable = function (p) {
			if (p === disabled) {
				disabled = !disabled;
				if (disabled) {
					LIB.css(div, {
						opacity: UI.theme.opacityOff,
						cursor: "default"
					});
				} else {
					LIB.css(div, {
						opacity: 1,
						cursor: "pointer"
					});
				}
			}
		};
		this.setTouchGlow = function (p) {
			touchGlow = p;
		};
		this.setImage = function (p) {
			im = p;
			updateBackground();
		};
		this.getDiv = function () {
			return div;
		};
		this.isEnabled = function () {
			return !disabled;
		};
	};
	/*UI.ToggleButton(p)
	A button that can be turned on and off by pressing.
	P =	{
		onlyOn: <boolean>				Pressing can't turn it off
		state: <boolean>				Initial state: on/off
		im: <string>					Icon from UI.theme.svgGrid. Example: "btn_clear.svg"
		text: <string>					The alternative to an image
		animated: <boolean>				Animates on pressing
		disabled: <boolean>				Disable/enable button
		touchGlow: <boolean>			Glow effect on touch
		callback: <function(<boolean>)>	Gets called on turning on/off
	}
	setState(<boolean>)			Set state on/off
	getDiv()					Returns div element of button
	*/
	UI.ToggleButton = function (p) {
		var state, callback, onlyOn, button;
		state = p.state;
		callback = p.callback;
		onlyOn = p.onlyOn || false;

		function update() {
			if (state === false) {
				LIB.css(button.getDiv(), {
					opacity: UI.theme.opacityOff
				});
			} else {
				LIB.css(button.getDiv(), {
					opacity: 1
				});
			}
		}
		button = new UI.Button({
			im: p.im,
			text: p.text,
			touchGlow: p.touchGlow,
			animated: p.animated,
			disabled: p.disabled,
			callback: function () {
				if (onlyOn && state === true) {
					return;
				}
				state = !state;
				if (state && onlyOn) {
					button.setTouchGlow(false);
				}
				update();
				callback(state);
			}
		});
		update();
		if (state && onlyOn) {
			button.setTouchGlow(false);
		}
		this.setState = function (p) {
			if (p === state) {
				return;
			}
			state = p;
			if (state && onlyOn) {
				button.setTouchGlow(false);
			} else if (!state && onlyOn) {
				button.setTouchGlow(true);
			}
			update();
		};
		this.getDiv = function () {
			return button.getDiv();
		};
	};
	/*UI.ExpandButton(p)
	Button used together with expand bar. Pretty similar to a toggle button.
	P =	{
		im: <string>				Icon from UI.theme.svgGrid. Example: "btn_clear.svg"
		text: <string>				The alternative to an image
		callback: <function(evt)>	Gets called on pressing
	}
	callback evt = {
		expanded: <boolean>
	}
	collapse()			"collapse" button
	setImage(<string>)	Change icon
	getDiv()			Returns div element of button
	*/
	UI.ExpandButton = function (p) {
		var callback, button, expanded;
		callback = p.callback;
		expanded = false;

		function update() {
			if (expanded) {
				button.getDiv().style.backgroundColor = UI.theme.expandCol;
			} else {
				button.getDiv().style.backgroundColor = "";
			}
		}
		button = new UI.Button({
			im: p.im,
			text: p.text,
			callback: function () {
				expanded = !expanded;
				update();
				callback({
					expanded: expanded
				});
			}
		});
		this.collapse = function () {
			if (!expanded) {
				return;
			}
			expanded = false;
			update();
		};
		this.setImage = function (p) {
			button.setImage(p);
		};
		this.getDiv = function () {
			return button.getDiv();
		};
	};
	/*UI.ColorButton(p)
	A different kind of ExpandButton. Previews a color. Has 3 states: not active, active, expanded
	p = {
		active: <boolean>			Initial state for active
		color: {r: , g: , b: }		Initial color
		callback: <function(evt)>	callback on state change
	}
	callback evt = {
		expanded: <boolean>
		active: <boolean>
	}
	active(<boolean>)			Set state to active or not active. automatically "collapses" button
	expand()					"expand" button
	collapse()					"collapse" button
	setColor({r: , g: , b: })	Set color of button
	getColor()					Returns color {r: , g: , b: } of button
	getDiv()					Get div element of button
	*/
	UI.ColorButton = function (p) {
		var boxSize, callback, active, expanded, color, div, colBox;
		boxSize = (2 * UI.theme.halfBoxSize);
		callback = p.callback;
		active = p.active;
		expanded = false;
		color = p.color;
		div = document.createElement("div");
		colBox = document.createElement("div");
		LIB.css(div, {
			width: boxSize + "px",
			height: boxSize + "px",
			cssFloat: "left",
			cursor: "pointer",
			transition: "background 0.1s ease-in"
		});
		LIB.css(colBox, {
			border: "1px solid rgba(255, 255, 255, 0.5)",
			transition: "all 0.1s",
			borderRadius: "50%",
			boxShadow: "0 2px 4px rgba(0, 0, 0, 1) inset"
		});
		div.appendChild(colBox);

		function update() {
			if (expanded) {
				div.style.background = UI.theme.expandCol;
				LIB.css(colBox, {
					transition: ""
				});
			} else {
				div.style.background = "";
				LIB.css(colBox, {
					transition: "all 0.1s"
				});
			}
			LIB.css(colBox, {
				background: "rgb(" + color.r + ", " + color.g + ", " + color.b + ")"
			});
			if (active) {
				LIB.css(colBox, {
					width: (boxSize * 0.75) + "px",
					height: (boxSize * 0.75) + "px",
					marginLeft: ((boxSize - boxSize * 0.75) / 2 - 2) + "px",
					marginTop: ((boxSize - boxSize * 0.75) / 2 - 2) + "px",
					border: "2px solid rgba(255, 255, 255, 1)"
				});
			} else {
				LIB.css(colBox, {
					width: (boxSize / 2) + "px",
					height: (boxSize / 2) + "px",
					marginLeft: ((boxSize - boxSize / 2) / 2) + "px",
					marginTop: ((boxSize - boxSize / 2) / 2) + "px",
					border: ""
				});
			}
		}

		function click() {
			if (active && !expanded) {
				expanded = true;
				update();
				callback({
					expanded: true
				});
			} else if (expanded) {
				expanded = false;
				update();
				callback({
					expanded: false
				});
			} else if (!active) {
				active = true;
				update();
				callback({
					active: true
				});
			}
		}
		div.onmousedown = function () {
			click();
		};
		div.ontouchstart = function (event) {
			var off;
			div.onmousedown = function () {};
			if (event.touches.length !== 1) {
				return false;
			}
			if (!active) {
				off = LIB.getGlobalOff(div);
				LIB.spawnGlow(off.x + boxSize / 2, off.y + boxSize / 2);
			}
			click();
			return false;
		};
		//interface
		this.active = function (p) {
			active = p;
			expanded = false;
			update();
		};
		this.expand = function () {
			if (expanded) {
				return;
			}
			expanded = true;
			update();
		};
		this.collapse = function () {
			if (!expanded) {
				return;
			}
			expanded = false;
			update();
		};
		this.setColor = function (c) {
			color = c;
			update();
		};
		this.getColor = function () {
			return {
				r: color.r,
				g: color.g,
				b: color.b
			};
		};
		this.getDiv = function () {
			return div;
		};
		update();
	};
	/*UI.ExpandBar(p)
	A bar on which new UI elements can be placed. Collapses and expands with an animation.
	Goes with ExpandButton/ColorButton.
	p = {
		width: <number>		width in grid units defined by UI.theme
		height: <number>	height in grid units defined by UI.theme
	}
	collapse()		Collapse bar
	expand()		Expand bar
	getDiv()		Returns div element of bar
	*/
	UI.ExpandBar = function (p) {
		var div, direction, expanded, width, height, boxSizePlus, hideTimeout;
		div = document.createElement("div");
		direction = 1;
		expanded = false;
		width = p.width * 2 * UI.theme.halfBoxSize;
		height = p.height * 2 * UI.theme.halfBoxSize;
		boxSizePlus = 2 * UI.theme.halfBoxSize + 4;
		hideTimeout = undefined;
		//style
		LIB.css(div, {
			opacity: 0,
			position: "absolute",
			width: width + "px",
			height: height + "px",
			left: "0",
			top: (direction * 2 * UI.theme.halfBoxSize - boxSizePlus) + "px",
			paddingTop: (boxSizePlus) + "px",
			background: UI.theme.expandCol,
			borderBottomRightRadius: (UI.theme.halfBoxSize / 3) + "px",
			borderBottomLeftRadius: (UI.theme.halfBoxSize / 3) + "px",
			transition: "all 0.1s ease-out",
			transform: "translate(0, " + (direction * -height) + "px)",
			pointerEvents: "none"
		});
		div.ontouchstart = function () {
			return false;
		};

		function update() {
			if (!expanded) {
				LIB.css(div, {
					transform: "translate(0, " + (direction * -height) + "px)",
					boxShadow: "0 2px 4px rgba(0, 0, 0, 0)",
					pointerEvents: "none"
				});
			} else {
				LIB.css(div, {
					transform: "translate(0, 0)",
					boxShadow: "0 2px 4px rgba(0, 0, 0, 0.5)",
					pointerEvents: ""
				});
			}
		}

		function expand(p) {
			if (expanded === p) {
				return;
			}
			expanded = p;
			if (expanded) {
				clearTimeout(hideTimeout);
				LIB.css(div, {
					opacity: 1
				});
				update();
			} else {
				hideTimeout = setTimeout(function () {
					LIB.css(div, {
						opacity: 0
					});
				}, 101);
				update();
			}
		}
		//interface
		this.collapse = function () {
			expand(false);
		};
		this.expand = function () {
			expand(true);
		};
		this.getDiv = function () {
			return div;
		};
	};
	/*UI.EmptySlot(slots)
	Creates empty space with a width of: slots * gridSize
	getDiv()	Returns the div element
	*/
	UI.EmptySlot = function (p) {
		var div = document.createElement("div");
		div.style.cssFloat = "left";
		div.style.height = (UI.theme.halfBoxSize * 2) + "px";
		div.style.width = (p * UI.theme.halfBoxSize * 2) + "px";
		this.getDiv = function () {
			return div;
		};
	};
	/*UI.Slider(p)
	A slider with snapping
	p = {
		value: <number[0.0, 1.0]>	Init value of the slider
		width: <number>				Width of slider element in px
		caption: <string>			Caption above the slider
		disabled: <boolean>			Init state disabled/enabled
		left: <number>				Left offset of slider in px (absolute positioning)
		callback: <function(<number[0.0, 1.0]>)>	Callback on value change. Value between 0-1
	}
	enable(<boolean>)		Enable/disable slider
	getDiv()				Returns the div element
	*/
	UI.Slider = function (p) {
		var div, value, callback, width, label, boxSize, border, enabled, eventDiv, circleDiv, hideTimeout,
			sliderSize, circleSize, fillDiv, slideBox, eventBox;
		div = document.createElement("div");
		value = p.value;
		callback = p.callback || function () {};
		width = p.width;
		label = document.createElement("div");
		label.innerHTML = p.caption;
		boxSize = UI.theme.halfBoxSize * 2;
		border = boxSize * 0.2;
		enabled = !(p.disabled || false);
		sliderSize = boxSize / 2;
		circleSize = boxSize / 2.5;
		eventDiv = document.createElement("div");
		fillDiv = document.createElement("div");
		circleDiv = document.createElement("div");
		slideBox = document.createElement("div");
		eventBox = document.createElement("div");
		function update() {
			LIB.css(fillDiv, {
				width: (sliderSize / 2 + value * (width - 2 * border - sliderSize)) + "px"
			});
			LIB.css(circleDiv, {
				left: (border + sliderSize / 2 + value * (width - 2 * border - sliderSize)) + "px"
			});
			LIB.css(slideBox, {
				marginLeft: (border) + "px",
				marginTop: (1.8 * border) + "px"
			});
		}
		LIB.attachMouseListener(eventBox, function (val) {
			if (!enabled) {
				return;
			}
			if (val.dragdone === false) {
				value = val.x;
				value = (Math.min(6, parseInt(value * 7, 10)) / 6);
				update();
				callback(value);
			}
		});
		LIB.css(div, {
			position: "absolute",
			left: p.left + "px",
			width: width + "px",
			height: boxSize + "px",
			transition: "opacity 0.2s linear"
		});
		if (!enabled) {
			LIB.css(div, {
				opacity: UI.theme.opacityOff,
				pointerEvents: "none"
			});
		}
		LIB.css(slideBox, {
			backgroundColor: "#313131",
			width: (width - 2 * border) + "px",
			height: sliderSize + "px",
			borderRadius: (boxSize / 4) + "px",
			marginLeft: (border) + "px",
			marginTop: (1.8 * border) + "px",
			boxShadow: "inset 0 " + (boxSize / 8) + "px " + (boxSize / 5) + "px #000, 0 " + (boxSize / 23) + "px " + (boxSize / 25) + "px #777"
		});
		LIB.css(fillDiv, {
			position: "absolute",
			backgroundColor: "#404040",
			width: (width - 2 * border) + "px",
			height: circleSize + "px",
			borderTopLeftRadius: (circleSize / 2) + "px",
			borderBottomLeftRadius: (circleSize / 2) + "px",
			left: (border + (sliderSize - circleSize) / 2) + "px",
			top: (1.8 * border + (sliderSize - circleSize) / 2) + "px",
			boxShadow: "inset " + (-boxSize / 10) + "px " + (-boxSize / 10) + "px " + (boxSize / 3) + "px #151515"
		});
		LIB.css(circleDiv, {
			width: circleSize + "px",
			height: circleSize + "px",
			borderRadius: (circleSize / 2) + "px",
			position: "absolute",
			marginLeft: (-circleSize / 2) + "px",
			marginTop: (-circleSize / 2) + "px",
			left: (border + sliderSize / 2) + "px",
			top: (1.8 * border + sliderSize / 2) + "px",
			background: "#dedede"
		});
		LIB.css(label, {
			fontSize: (border * 1.4) + "px",
			position: "absolute",
			width: width + "px",
			textAlign: "center",
			color: "#ccc",
			left: "0",
			top: "0"
		});
		LIB.css(eventBox, {
			position: "absolute",
			width: (width - 2 * border) + "px",
			height: sliderSize + "px",
			left: (border) + "px",
			top: (1.8 * border) + "px",
			cursor: "pointer"
		});
		div.appendChild(slideBox);
		div.appendChild(fillDiv);
		div.appendChild(circleDiv);
		div.appendChild(label);
		div.appendChild(eventBox);
		this.enable = function (p) {
			if (enabled === p) {
				return;
			}
			enabled = p;
			if (hideTimeout) {
				clearTimeout(hideTimeout);
			}
			if (!enabled) {
				div.style.opacity = UI.theme.opacityOff;
				hideTimeout = setTimeout(function () {
					eventBox.style.cursor = "default";
					div.style.pointerEvents = "none";
				}, 200);
			} else {
				eventBox.style.cursor = "pointer";
				div.style.pointerEvents = "";
				hideTimeout = setTimeout(function () {
					div.style.opacity = 1;
				}, 10);
			}
		};
		this.getDiv = function () {
			return div;
		};
		update();
	};
	/*UI.Label(p)
	Displays some text
	p = {
		text: <string>		The text you want to display
		width: <number>		Width of label in grid size
	}
	getDiv()		Returns the div element
	*/
	UI.Label = function (p) {
		var div, width, boxSize;
		div = document.createElement("div");
		width = p.width;
		boxSize = UI.theme.halfBoxSize * 2;
		div.innerHTML = p.text;
		LIB.css(div, {
			cssFloat: "left",
			width: (width * boxSize - boxSize / 3.5) + "px",
			paddingLeft: (boxSize / 3.5) + "px",
			fontSize: (boxSize / 3.0) + "px",
			paddingTop: (boxSize / 3.5) + "px",
			cursor: "default",
			color: UI.theme.labelColor
		});
		this.getDiv = function () {
			return div;
		};
	};
	/*UI.showPopup(p)
	Displays an overlay/popup in the target element.
	p = {
		target: <div>		Element this pop-up gets appended to
		div: <div>			Content you want to display
		setCallback: <function(<function()>)>	Tells you what function to call to close the pop-up
	}
	*/
	UI.showPopup = (function () {
		var popDiv;
		return function (p) {
			var close;
			if (!popDiv) {
				popDiv = document.createElement("div");
				LIB.css(popDiv, {
					position: "absolute",
					left: "0",
					top: "0",
					width: "100%",
					height: "100%",
					opacity: 0,
					transition: "opacity 0.3s linear"
				});
				popDiv.bgDiv = document.createElement("div");
				LIB.css(popDiv.bgDiv, {
					width: "100%",
					height: "100%",
					background: "rgba(0, 0, 0, 0.5)"
				});
				popDiv.appendChild(popDiv.bgDiv);
				popDiv.contentWrapper = document.createElement("div");
				LIB.css(popDiv.contentWrapper, {
					position: "absolute",
					left: "0",
					top: "0",
					width: "100%",
					height: "100%"
				});
				popDiv.appendChild(popDiv.contentWrapper);
			}
			popDiv.contentWrapper.innerHTML = "";
			popDiv.contentWrapper.appendChild(p.div);
			LIB.css(p.div, {
				width: (7 * UI.theme.halfBoxSize * 2) + "px",
				marginLeft: "auto",
				marginRight: "auto",
				position: "relative"
			});
			p.target.appendChild(popDiv);
			setTimeout(function () {
				LIB.css(popDiv, {
					opacity: 1
				});
			}, 20);
			close = function () {
				LIB.css(popDiv, {
					opacity: 0
				});
				setTimeout(function () {
					p.target.removeChild(popDiv);
					popDiv.contentWrapper.innerHTML = "";
				}, 300);
			};
			p.setCallback(close);
		};
	}());
	/*UI.showAboutPage(parent)
	Displays the about page of Webchemy. Takes care of everything on its own.
	
	parent		The div element you want the popup/about-page to be appended to
	*/
	UI.showAboutPage = function (parent) {
		var boxSize, aboutCloseFunc, backButton, logo, text, aboutDiv;
		boxSize = UI.theme.halfBoxSize * 2;
		aboutCloseFunc = function () {};
		backButton = document.createElement("div");
		logo = document.createElement("div");
		text = document.createElement("div");
		aboutDiv = document.createElement("div");
		LIB.css(aboutDiv, {
			width: (7 * boxSize) + "px",
			backgroundColor: UI.theme.expandCol,
			borderBottomRightRadius: (UI.theme.halfBoxSize / 3) + "px",
			borderBottomLeftRadius: (UI.theme.halfBoxSize / 3) + "px"
		});
		backButton.innerHTML = "back";
		logo.innerHTML = "Webchemy";
		text.innerHTML = 'Webchemy is an attempt to recreate parts of Alchemy on the web, with support for mobile platforms like the iPad.<br/>by <a href="http://bitbof.com" target="_blank">bitbof</a> 2012' + '<br /><br />' + 'Alchemy was initiated by Karl D.D. Willis & Jacob Hina.' + '<br /><br />' + '<a href="https://github.com/bitbof/Webchemy" target="_blank">Webchemy Source Code (github)</a><br/>' + '<a href="http://al.chemy.org/" target="_blank">Alchemy Homepage</a>';

		function backClick() {
			aboutCloseFunc();
		}
		backButton.onmousedown = function () {
			backClick();
			return false;
		};
		backButton.ontouchstart = function (event) {
			backButton.onmousedown = function () {};
			if (event.touches.length !== 1) {
				return false;
			}
			backClick();
			return false;
		};
		LIB.css(backButton, {
			height: (boxSize - (boxSize / 3.5)) + "px",
			width: (boxSize * 7) + "px",
			backgroundColor: UI.theme.barCol,
			textAlign: "center",
			fontSize: (boxSize / 3.0) + "px",
			paddingTop: (boxSize / 3.5) + "px",
			cursor: "pointer",
			fontWeight: "bold"
		});
		LIB.css(logo, {
			fontSize: (boxSize / 2) + "px",
			textAlign: "center",
			width: (boxSize * 7) + "px",
			paddingTop: (boxSize / 3.5) + "px"
		});
		LIB.css(text, {
			fontSize: (boxSize / 3.0) + "px",
			padding: (boxSize / 3.5) + "px",
			color: UI.theme.labelColor
		});
		backButton.className = "WebchemyAppShadedBar";
		aboutDiv.appendChild(backButton);
		aboutDiv.appendChild(logo);
		aboutDiv.appendChild(text);
		UI.showPopup({
			target: parent,
			div: aboutDiv,
			setCallback: function (f) {
				aboutCloseFunc = f;
			}
		});
	};
	/*UI.ButtonBarCombination(p)
	Coordinates an ExpandButton and an ExpandBar. ButtonBarCombinations go into a BarContainer.
	p = {
		im: <string>				Icon from UI.theme.svgGrid, used for the button. Example: "btn_clear.svg"
		callback: <function(evt)>	Callback on expand/collapse and even when collapse() is called
	}
	callback evt = {
		expand:	<boolean>		True on expand
		collapse: <boolean>		True on collapse
	}
	collapse()						Collapses combination. Also causes a callback.
	addListener(<function(evt)>)	Adds a callback listener
	getBar()						Returns the ExpandBar object (not div)
	getButton()						Returns the ExpandButton object (not div)
	*/
	UI.ButtonBarCombination = function (p) {
		var bar, listeners, button;
		listeners = [];
		if (p.callback !== undefined) {
			listeners.push(p.callback);
		}

		function callback(p) {
			var i;
			for (i = 0; i < listeners.length; i += 1) {
				listeners[i](p);
			}
		}
		bar = new UI.ExpandBar({
			width: 7,
			height: 1
		});
		button = new UI.ExpandButton({
			im: p.im,
			callback: function (val) {
				if (val.expanded) {
					bar.expand();
					callback({
						expand: true
					});
				} else if (val.expanded === false) {
					bar.collapse();
					callback({
						collapse: true
					});
				}
			}
		});
		//interface
		this.collapse = function () {
			button.collapse();
			bar.collapse();
			callback({
				collapse: true
			});
		};
		this.addListener = function (p) {
			listeners.push(p);
		};
		this.getBar = function () {
			return bar;
		};
		this.getButton = function () {
			return button;
		};
	};
	/*UI.ColorSelection(callback)
	2 Sliders, one for Hue and one for Saturation/Value.
	callback	{r: 0-255, g: 0-255, b: 0-255} Currently selected color. On change.
	
	setcolor({r: , g: , b: })	Set color for sliders
	getDiv()					Returns the div element with both sliders
	*/
	UI.ColorSelection = function (callback) {
		var div, color, boxSize, border, svCanvas, svDivSize, hCanvas, svPointer, hPointer;
		div = document.createElement("div");
		div.style.position = "relative";
		boxSize = UI.theme.halfBoxSize * 2;
		border = boxSize * 0.2;
		svCanvas = document.createElement("canvas");
		svCanvas.width = 10;
		svCanvas.height = 10;
		svDivSize = {
			width: parseInt(boxSize * 3 - 1.5 * border, 10),
			height: parseInt(boxSize * 3 - 2 * border, 10)
		};
		hCanvas = document.createElement("canvas");
		hCanvas.width = parseInt(boxSize - 1.5 * border, 10);
		hCanvas.height = parseInt(boxSize * 3 - 2 * border, 10);
		(function () {
			var ctx, gradH, i, col;
			ctx = hCanvas.getContext("2d");
			gradH = ctx.createLinearGradient(0, hCanvas.height, 0, 0);
			for (i = 0; i < 1; i += 0.02) {
				col = LIB.color.hsvToRgb({
					h: i * 360,
					s: 100,
					v: 100
				});
				gradH.addColorStop(i, 'rgb(' + parseInt(col.r, 10) + ", " + parseInt(col.g, 10) + ", " + parseInt(col.b, 10) + ")");
			}
			ctx.fillStyle = gradH;
			ctx.fillRect(0, 0, hCanvas.width, hCanvas.height);
		}());
		svPointer = document.createElement("div");
		hPointer = document.createElement("div");

		function updateSV() {
			var svContext, stepHeight, i, gradient1, colleft, colright;
			svContext = svCanvas.getContext("2d");
			stepHeight = 1;
			for (i = 0; i < svCanvas.height; i += stepHeight) {
				gradient1 = svContext.createLinearGradient(0, 0, svCanvas.width, 0);
				colleft = LIB.color.hsvToRgb({
					h: color.h,
					s: 1,
					v: 100 - (i / svCanvas.height * 100.0)
				});
				colright = LIB.color.hsvToRgb({
					h: color.h,
					s: 100,
					v: 100 - (i / svCanvas.height * 100.0)
				});
				gradient1.addColorStop(0, LIB.color.rgbToHex(colleft));
				gradient1.addColorStop(1, LIB.color.rgbToHex(colright));
				svContext.fillStyle = "#ff0000"; //needed for chrome...otherwise alpha problem
				svContext.fillStyle = gradient1;
				svContext.fillRect(0, i, svCanvas.width, stepHeight);
			}
		}

		function updateCursors() {
			LIB.css(svPointer, {
				left: ((boxSize + 0.5 * border) + svDivSize.width * color.s / 100) + "px",
				top: (border + svDivSize.height * (100 - color.v) / 100) + "px"
			});
			LIB.css(hPointer, {
				left: border + "px",
				top: (border + svDivSize.height * (1 - color.h / 360)) + "px"
			});
		}

		function update() {
			updateSV();
			updateCursors();
		}
		LIB.attachMouseListener(svCanvas, function (val) {
			var newCol;
			if (val.dragdone === false) {
				color.s = val.x * 100;
				color.v = (1 - val.y) * 100;
				newCol = LIB.color.hsvToRgb({
					h: color.h,
					s: color.s,
					v: color.v
				});
				color.r = newCol.r;
				color.g = newCol.g;
				color.b = newCol.b;
				updateCursors();
				callback(color);
			}
		});
		LIB.attachMouseListener(hCanvas, function (val) {
			var newCol;
			if (val.dragdone === false) {
				color.h = (1 - val.y) * 360;
				newCol = LIB.color.hsvToRgb({
					h: color.h,
					s: color.s,
					v: color.v
				});
				color.r = newCol.r;
				color.g = newCol.g;
				color.b = newCol.b;
				update();
				callback(color);
			}
		});
		//css
		LIB.css(svCanvas, {
			position: "absolute",
			left: (boxSize + 0.5 * border - UI.theme.halfBoxSize / 22) + "px",
			top: (border - UI.theme.halfBoxSize / 22) + "px",
			width: svDivSize.width + "px",
			height: svDivSize.height + "px",
			border: (UI.theme.halfBoxSize / 22) + "px solid " + UI.theme.barCol
		});
		LIB.css(hCanvas, {
			position: "absolute",
			left: (border - UI.theme.halfBoxSize / 22) + "px",
			top: (border - UI.theme.halfBoxSize / 22) + "px",
			border: (UI.theme.halfBoxSize / 22) + "px solid " + UI.theme.barCol
		});
		LIB.css(svPointer, {
			position: "absolute",
			width: "10px",
			height: "10px",
			borderRadius: "5px",
			pointerEvents: "none",
			border: "1px solid rgba(255, 255, 255, 1)",
			boxShadow: "0 0 0 1px rgba(0, 0, 0, 1)",
			marginLeft: "-5px",
			marginTop: "-5px"
		});
		LIB.css(hPointer, {
			position: "absolute",
			width: hCanvas.width + "px",
			height: "0px",
			pointerEvents: "none",
			borderTop: "2px solid #fff",
			borderBottom: "2px solid #000"
		});
		div.appendChild(svCanvas);
		div.appendChild(hCanvas);
		div.appendChild(svPointer);
		div.appendChild(hPointer);

		function setColor(c) {
			var hsv;
			color = c;
			hsv = LIB.color.rgbToHsv({
				r: c.r,
				g: c.g,
				b: c.b
			});
			color.h = hsv.h;
			color.s = hsv.s;
			color.v = hsv.v;
			update();
		}
		this.setColor = function (c) {
			setColor(c);
		};
		this.getDiv = function () {
			return div;
		};
	};
	/*UI.ColorButtonBarCombination(p)
	Coordinates two ColorButtons and an ExpandBar. ColorButtonBarCombination goes into a BarContainer.
	P = {
		callback: <function(evt)>	On state change
	}
	callback evt = {
		collapse: <boolean>		True on collapse
		expand: <boolean>		True on expand
		color: {r: , g: , b: }	Currently selected color
	}
	collapse()						Collapses combination. Also causes a callback.
	addListener(<function(evt)>)	Adds a callback listener
	getBar()						Returns the ExpandBar object (not div)
	getButton()						Returns object that contains a getDiv() method to get the div element
									that contains both ColorButtons
	*/
	UI.ColorButtonBarCombination = function (p) {
		var bar, listeners, buttonContainer, button1, activeButton, colSel, button2;
		listeners = [];
		if (p.callback !== undefined) {
			listeners.push(p.callback);
		}

		function callback(p) {
			var i;
			for (i = 0; i < listeners.length; i += 1) {
				listeners[i](p);
			}
		}
		buttonContainer = document.createElement("div");
		LIB.css(buttonContainer, {
			width: (4 * UI.theme.halfBoxSize) + "px"
		});
		bar = new UI.ExpandBar({
			width: 4,
			height: 3
		});
		button1 = new UI.ColorButton({
			color: {
				r: 0,
				g: 0,
				b: 0
			},
			active: true,
			callback: function (val) {
				if (val.active) {
					activeButton = button1;
					button2.active(false);
					bar.collapse();
					callback({
						collapse: true,
						color: button1.getColor()
					});
				}
				if (val.expanded) {
					bar.expand();
					colSel.setColor(activeButton.getColor());
					callback({
						expand: true
					});
				} else if (val.expanded === false) {
					bar.collapse();
					callback({
						collapse: true
					});
				}
			}
		});
		button2 = new UI.ColorButton({
			color: {
				r: 255,
				g: 255,
				b: 255
			},
			active: false,
			callback: function (val) {
				if (val.active) {
					activeButton = button2;
					button1.active(false);
					bar.collapse();
					callback({
						collapse: true,
						color: button2.getColor()
					});
				}
				if (val.expanded) {
					bar.expand();
					colSel.setColor(activeButton.getColor());
					callback({
						expand: true
					});
				} else if (val.expanded === false) {
					bar.collapse();
					callback({
						collapse: true
					});
				}
			}
		});
		buttonContainer.appendChild(button1.getDiv());
		buttonContainer.appendChild(button2.getDiv());
		activeButton = button1;
		colSel = new UI.ColorSelection(function (c) {
			activeButton.setColor(c);
			callback({
				color: c
			});
		});
		bar.getDiv().appendChild(colSel.getDiv());
		//interface
		this.collapse = function () {
			button1.collapse();
			button2.collapse();
			bar.collapse();
		};
		this.addListener = function (p) {
			listeners.push(p);
		};
		this.getBar = function () {
			return bar;
		};
		this.getButton = function () {
			return {
				getDiv: function () {
					return buttonContainer;
				}
			};
		};
	};
	/*UI.BarContainer()
	Manages all ButtonBarCombinations. Puts all ExpandButtons and ColorButtons on their own bar.
	add(<ButtonBarCombination> or <ColorButtonBarCombination>)	Add a combination
	toggleHide()	Toggles between showing and hiding the BarContainer. Animated.
	collapse()		Collapses currently expanded bar
	isHidden()		Is the bar hidden or visible
	getDiv()		Return div element of BarContainer
	*/
	UI.BarContainer = function () {
		var bars, div, frontDiv, backDiv, boxSize, current, hidden;
		bars = [];
		div = document.createElement("div");
		frontDiv = document.createElement("div");
		backDiv = document.createElement("div");
		boxSize = UI.theme.halfBoxSize * 2;
		hidden = false;
		//style
		LIB.css(div, {
			width: (7 * boxSize) + "px",
			height: boxSize + "px",
			position: "absolute",
			transition: "top 0.1s ease-out",
			marginLeft: (-boxSize * 3.5) + "px",
			top: "0"
		});
		LIB.css(frontDiv, {
			width: (7 * boxSize) + "px",
			height: boxSize + "px",
			backgroundColor: UI.theme.barCol,
			position: "absolute",
			left: "0",
			top: "0",
			borderBottomRightRadius: (UI.theme.halfBoxSize / 3) + "px",
			borderBottomLeftRadius: (UI.theme.halfBoxSize / 3) + "px"
		});
		LIB.css(backDiv, {
			width: (7 * boxSize) + "px",
			height: boxSize + "px",
			position: "absolute",
			left: "0",
			top: "0",
			borderBottomRightRadius: (UI.theme.halfBoxSize / 3) + "px",
			borderBottomLeftRadius: (UI.theme.halfBoxSize / 3) + "px",
			boxShadow: "0 2px 4px rgba(0, 0, 0, 0.5)"
		});
		frontDiv.className = "WebchemyAppShadedBar";
		LIB.addCssRule(".WebchemyAppShadedBar", "background-image: -webkit-linear-gradient(bottom, rgba(255, 255, 255, 0) 20%, rgba(255, 255, 255, 0.4) 100%); background-image: -moz-linear-gradient(center bottom, rgba(255, 255, 255, 0) 20%, rgba(255, 255, 255, 0.4) 100%); background-image: -o-linear-gradient(bottom, rgba(255, 255, 255, 0) 20%, rgba(255, 255, 255, 0.4) 100%);");
		div.appendChild(backDiv);
		div.appendChild(frontDiv);
		this.add = function (p) {
			bars.push(p);
			frontDiv.appendChild(p.getButton().getDiv());
			backDiv.appendChild(p.getBar().getDiv());
			p.addListener(function (val) {
				if (val.expand) {
					if (current && current !== p) {
						current.collapse();
					}
					current = p;
				}
				if (val.collapse) {
					if (current === p) {
						current = undefined;
					}
				}
			});
		};
		this.toggleHide = function () {
			hidden = !hidden;
			if (hidden) {
				LIB.css(div, {
					top: (-boxSize - 10) + "px"
				});
				if (current) {
					current.collapse();
				}
			} else {
				LIB.css(div, {
					top: "0"
				});
			}
		};
		this.collapse = function () {
			if (current) {
				current.collapse();
			}
		};
		this.isHidden = function () {
			return hidden;
		};
		this.getDiv = function () {
			return div;
		};
	};
	/*WebchemyBar(p)
	The menu/bar of Webchemy. Handles all the menus, buttons, sliders, actions, etc.
	p = {
		parent: <div>				Div element that the WebchemyBar goes into
		callback: <function(evt)>	Callback on state change or action
	}
	callback evt = {
		color: {r: , g: , b: }		Updating selected color
		clear: <boolean>			True on clear action
		exportSVG: <boolean>		True on export svg action
		exportPNG: <boolean>		True on export png action
		undo: <boolean>				True on undo action
		redo: <boolean>				True on redo action
		zoomIn: <boolean>			True on zoom in action
		zoomOut: <boolean>			True on zoom out action
		handTool: <boolean>			Hand tool active/not active
		gradient: <boolean>			Gradient on/off
		splat: <boolean>			Splat on/off
		mirrorHorizontal: <boolean>	Mirror Horizontal on/off
		mirrorVertical: <boolean>	Mirror Vertical on/off
		brushMode: <string>			"MODE_FILL" or "MODE_STROKE" brush mode update
		brushOpacity: <number[0,1]>	Opacity of brush updated
		brushSize:	<number [0, 1]>	Size/width of brush updated
	}
	isHidden()			Visibility of Bar true/false
	getDiv()			Returns the div element
	update(p_update)	update internal state
	update p_update = {
		zoom: <number>			Current zoom factor of view
		maxZoom: <number>		Maximum zoom factor
		minZoom: <number>		Minimum zoom factor
		undoCount: <number>		Currently possible undo actions
		redoCount:	<number>	Currently possible redo actions
		collapse: <boolean>		Request to collapse the expanded bar
		toggleHide: <boolean>	Request to hide/show the complete bar
	}
	*/
	function WebchemyBar(p) {
		var parent, callback, barContainer, colorBar, brushBar, brushContent, strokeButton, fillButton,
			opacitySlider, sizeSlider, modBar, modContent, mirrorHorButton, mirrorVertButton, gradientButton,
			splatButton, handButton, moreContent, undoButton, redoButton, zoomInButton,
			zoomOutButton, aboutButton, moreBar, clearBar, clearContent, clearLabel, clearYesButton,
			clearNoButton, exportBar, exportContent, exportLabel, exportSVGButton, exportPNGButton;
		parent = p.parent;
		callback = p.callback;
		barContainer = new UI.BarContainer();
		//Color Bar
		colorBar = new UI.ColorButtonBarCombination({
			callback: function (val) {
				if (val.color) {
					callback({
						color: val.color
					});
				}
			}
		});
		barContainer.add(colorBar);
		//Brush Bar
		brushBar = new UI.ButtonBarCombination({
			im: "btn_brushFill.svg"
		});
		barContainer.add(brushBar);
		brushContent = brushBar.getBar().getDiv();
		strokeButton = new UI.ToggleButton({
			im: "btn_stroke.svg",
			state: false,
			onlyOn: true,
			touchGlow: true,
			callback: function (val) {
				if (val) {
					callback({
						brushMode: "stroke"
					});
					brushBar.getButton().setImage("btn_brushStroke.svg");
					fillButton.setState(false);
					sizeSlider.enable(true);
				}
			}
		});
		fillButton = new UI.ToggleButton({
			im: "btn_fill.svg",
			state: true,
			onlyOn: true,
			touchGlow: true,
			callback: function (val) {
				if (val) {
					callback({
						brushMode: "fill"
					});
					brushBar.getButton().setImage("btn_brushFill.svg");
					strokeButton.setState(false);
					sizeSlider.enable(false);
				}
			}
		});
		opacitySlider = new UI.Slider({
			caption: "opacity",
			value: 1,
			width: UI.theme.halfBoxSize * 2 * 2.5,
			left: 2 * UI.theme.halfBoxSize * 2,
			callback: function (val) {
				callback({
					brushOpacity: val
				});
			}
		});
		sizeSlider = new UI.Slider({
			caption: "size",
			disabled: true,
			value: 0,
			width: UI.theme.halfBoxSize * 2 * 2.5,
			left: 4.5 * UI.theme.halfBoxSize * 2,
			callback: function (val) {
				callback({
					brushSize: val
				});
			}
		});
		brushContent.appendChild(strokeButton.getDiv());
		brushContent.appendChild(fillButton.getDiv());
		brushContent.appendChild(opacitySlider.getDiv());
		brushContent.appendChild(sizeSlider.getDiv());
		//Modifiers Bar
		modBar = new UI.ButtonBarCombination({
			im: "btn_modifiers.svg"
		});
		barContainer.add(modBar);
		modContent = modBar.getBar().getDiv();
		mirrorHorButton = new UI.ToggleButton({
			im: "btn_flipHor.svg",
			state: true,
			touchGlow: true,
			callback: function (val) {
				mirrorVertButton.setState(false);
				callback({
					mirrorHorizontal: val
				});
			}
		});
		mirrorVertButton = new UI.ToggleButton({
			im: "btn_flipVert.svg",
			state: false,
			touchGlow: true,
			callback: function (val) {
				mirrorHorButton.setState(false);
				callback({
					mirrorVertical: val
				});
			}
		});
		gradientButton = new UI.ToggleButton({
			im: "btn_gradientUp.svg",
			state: false,
			touchGlow: true,
			callback: function (val) {
				callback({
					gradient: val
				});
			}
		});
		splatButton = new UI.ToggleButton({
			im: "btn_splat.svg",
			state: false,
			touchGlow: true,
			callback: function (val) {
				callback({
					splat: val
				});
			}
		});
		modContent.appendChild(mirrorHorButton.getDiv());
		modContent.appendChild(mirrorVertButton.getDiv());
		modContent.appendChild(gradientButton.getDiv());
		modContent.appendChild(splatButton.getDiv());
		//More Bar
		moreBar = new UI.ButtonBarCombination({
			im: "btn_more.svg",
			callback: function (val) {
				if (val.collapse) {
					handButton.setState(false);
					callback({
						handTool: false
					});
				}
			}
		});
		barContainer.add(moreBar);
		moreContent = moreBar.getBar().getDiv();
		undoButton = new UI.Button({
			im: "btn_undo.svg",
			animated: true,
			disabled: true,
			touchGlow: true,
			callback: function () {
				callback({
					undo: true
				});
			}
		});
		redoButton = new UI.Button({
			im: "btn_redo.svg",
			animated: true,
			disabled: true,
			touchGlow: true,
			callback: function () {
				callback({
					redo: true
				});
			}
		});
		zoomInButton = new UI.Button({
			im: "btn_zoomIn.svg",
			animated: true,
			touchGlow: true,
			callback: function () {
				callback({
					zoomIn: true
				});
			}
		});
		zoomOutButton = new UI.Button({
			im: "btn_zoomOut.svg",
			animated: true,
			touchGlow: true,
			callback: function () {
				callback({
					zoomOut: true
				});
			}
		});
		handButton = new UI.ToggleButton({
			im: "btn_hand.svg",
			touchGlow: true,
			state: false,
			callback: function (val) {
				callback({
					handTool: val
				});
			}
		});
		aboutButton = new UI.Button({
			im: "btn_about.svg",
			callback: function () {
				UI.showAboutPage(parent);
				barContainer.collapse();
			}
		});
		moreContent.appendChild(undoButton.getDiv());
		moreContent.appendChild(redoButton.getDiv());
		moreContent.appendChild(zoomInButton.getDiv());
		moreContent.appendChild(zoomOutButton.getDiv());
		moreContent.appendChild(handButton.getDiv());
		moreContent.appendChild(new UI.EmptySlot(1).getDiv());
		moreContent.appendChild(aboutButton.getDiv());
		//Clear Bar
		clearBar = new UI.ButtonBarCombination({
			im: "btn_clear.svg"
		});
		barContainer.add(clearBar);
		clearContent = clearBar.getBar().getDiv();
		clearLabel = new UI.Label({
			text: "Clear the canvas?",
			width: 5
		});
		clearYesButton = new UI.Button({
			text: "Yes",
			style: {
				textShadow: "0 0 6px rgba(200, 50, 50, 1)"
			},
			callback: function () {
				callback({
					clear: true
				});
				barContainer.collapse();
			}
		});
		clearNoButton = new UI.Button({
			text: "No",
			callback: function () {
				barContainer.collapse();
			}
		});
		clearContent.appendChild(clearLabel.getDiv());
		clearContent.appendChild(clearYesButton.getDiv());
		clearContent.appendChild(clearNoButton.getDiv());
		//Export Bar
		exportBar = new UI.ButtonBarCombination({
			im: "btn_export.svg"
		});
		barContainer.add(exportBar);
		exportContent = exportBar.getBar().getDiv();
		exportLabel = new UI.Label({
			text: "Export/Save",
			width: 5
		});
		exportSVGButton = new UI.Button({
			text: "SVG",
			callback: function () {
				callback({
					exportSVG: true
				});
				barContainer.collapse();
			}
		});
		exportPNGButton = new UI.Button({
			text: "PNG",
			callback: function () {
				callback({
					exportPNG: true
				});
				barContainer.collapse();
			}
		});
		exportContent.appendChild(exportLabel.getDiv());
		exportContent.appendChild(exportSVGButton.getDiv());
		exportContent.appendChild(exportPNGButton.getDiv());
		//Interface
		this.update = function (p) {
			if (p.zoom !== undefined) {
				zoomInButton.enable(p.zoom < p.maxZoom);
				zoomOutButton.enable(p.zoom > p.minZoom);
			}
			if (p.undoCount !== undefined) {
				undoButton.enable(p.undoCount > 0);
			}
			if (p.redoCount !== undefined) {
				redoButton.enable(p.redoCount > 0);
			}
			if (p.collapse) {
				barContainer.collapse();
			}
			if (p.toggleHide) {
				barContainer.toggleHide();
			}
		};
		this.isHidden = function () {
			return barContainer.isHidden();
		};
		this.getDiv = function () {
			return barContainer.getDiv();
		};
	}
	/*WebchemyCanvasView(p)
	View of the WebchemyCanvas that allows zooming, panning, tap gestures and records key inputs(undo).
	p = {
		canvas:	<div>				Div element of the WebchemyCanvas
		width: <number>				Width of viewport in px
		height: <number>			Height of viewport in px
		callback: <function(evt)>	Callback on input events
	}
	callback evt = {
		undo: <boolean>				On undo event (ctrl + z)
		zoom: <number>				Current zoom factor
		maxZoom: <number>			Maximum zoom factor
		minZoom: <number>			Minimum zoom factor
		singleTap: <boolean>		On single tap event (one short tap)
		x: <number>					Position of cursor on canvas in px
		y: <number>					Position of cursor on canvas in px
		down: <boolean>				On mousedown or touchstart
		dragdone: <boolean>			True/false when dragging (drawing)
	}
	reset()						Reset the view - center and set zoom to 1
	resize({width:, height:})	Resize viewport			
	zoomIn()					Zoom-out action
	zoomOut()					Zoom-in action
	setHandTool(<boolean>)		Set hand tool on/off	
	getDiv()					Return the div element
	*/
	function WebchemyCanvasView(p) {
		var keys, canvas, callback, width, height, zoom, translate, mode, div, canvasWrapper, cursor, cursorHandIm,
			zoomWrapper, gestureHandler, MODE_DRAWING, MODE_HAND, CURSOR_CROSSHAIR, CURSOR_HAND;
		MODE_DRAWING = 0;
		MODE_HAND = 1;
		CURSOR_CROSSHAIR = 0;
		CURSOR_HAND = 1;
		keys = {
			KEY_Z: 90,
			KEY_CTRL: 17,
			KEY_SPACE: 32,
			ctrlPressed: false,
			spacePressed: false
		};
		canvas = p.canvas;
		callback = p.callback;
		width = p.width;
		height = p.height;
		zoom = 1;
		translate = {
			x: 0,
			y: 0
		};
		mode = MODE_DRAWING;
		div = document.createElement("div");
		canvasWrapper = document.createElement("div");
		zoomWrapper = document.createElement("div");
		LIB.loadImageToDataURL({
			src: "cursor_hand.png",
			callback: function (p) {
				cursorHandIm = p;
			}
		});
		function setCursor(c) {
			if (c === cursor) {
				return;
			}
			cursor = c;
			if (cursor === CURSOR_CROSSHAIR) {
				div.style.cursor = "crosshair";
			}
			if (cursor === CURSOR_HAND) {
				div.style.cursor = "url(" + cursorHandIm + ") 10 10, move";
			}
		}

		function onKeys(val) {
			var unicode;
			unicode = val.keyCode || val.charCode;
			if (val.down) {
				if (unicode === keys.KEY_SPACE) {
					keys.spacePressed = true;
					setCursor(CURSOR_HAND);
				}
				if (unicode === keys.KEY_CTRL) {
					keys.ctrlPressed = true;
				}
				if (unicode === keys.KEY_Z && keys.ctrlPressed) {
					val.preventDefault();
					callback({
						undo: true
					});
				}
			} else if (val.up) {
				if (unicode === keys.KEY_SPACE) {
					keys.spacePressed = false;
					setCursor(CURSOR_CROSSHAIR);
				}
				if (unicode === keys.KEY_CTRL) {
					keys.ctrlPressed = false;
				}
			}
		}
		document.addEventListener("keydown", function (val) {
			val.down = true;
			onKeys(val);
		});
		document.addEventListener("keyup", function (val) {
			val.up = true;
			onKeys(val);
		});
		window.addEventListener("blur", function () {
			keys.spacePressed = false;
			keys.ctrlPressed = false;
		});
		function update() {
			var canvasSize = canvas.getSize();
			LIB.css(zoomWrapper, {
				left: (width / 2) + "px",
				top: (height / 2) + "px"
			});
			LIB.css(canvas, {
				marginLeft: (-canvasSize.width / 2 + translate.x) + "px",
				marginTop: (-canvasSize.height / 2 + translate.y) + "px"
			});
			LIB.css(canvasWrapper, {
				transform: "scale(" + zoom + ", " + zoom + ")"
			});
		}
		function zoomStateCallback() {
			callback({
				zoom: zoom,
				minZoom: 1 / 8,
				maxZoom: 8
			});
		}
		function reset() {
			translate = {
				x: 0,
				y: 0
			};
			zoom = 1;
			zoomStateCallback();
			LIB.css(canvas, {
				transition: "all 0.3s ease-in-out"
			});
			setTimeout(function () {
				LIB.css(canvas, {
					transition: ""
				});
			}, 300);
			update();
		}
		gestureHandler = (function () {
			var dblTap, maxTime, tapTimeout;
			dblTap = {
				start: 0,
				tapCount: 0,
				dragStart: {
					x: 0,
					y: 0
				},
				dragDist: 0
			};
			maxTime = 200;
			return {
				add: function (val) {
					var dTime;
					if (val.code !== 0) {
						return;
					}
					if (val.down) {
						dTime = new Date().getTime() - dblTap.start;
						if (tapTimeout) {
							clearTimeout(tapTimeout);
						}
						if (dTime > maxTime) {
							dblTap.tapCount = 0;
						}
						dblTap.start = new Date().getTime();
						dblTap.dragStart = {
							x: val.absX,
							y: val.absY
						};
						dblTap.dragDist = 0;
					}
					if (val.dragdone === false) {
						dblTap.dragDist = LIB.Vec2.dist(dblTap.dragStart, {
							x: val.absX,
							y: val.absY
						});
					}
					if (val.dragdone === true) {
						dTime = new Date().getTime() - dblTap.start;
						dblTap.start = new Date().getTime();
						if (dTime < maxTime && dblTap.dragDist <= 5) {
							dblTap.tapCount += 1;
						} else {
							dblTap.tapCount = 0;
						}
						if (dblTap.tapCount === 1) {
							tapTimeout = setTimeout(function () {
								callback({
									singleTap: true
								});
							}, maxTime + 10);
						}
						if (dblTap.tapCount === 2) {
							tapTimeout = setTimeout(function () {
								reset();
							}, maxTime + 10);
						}
					}
				}
			};
		}());
		function zoomIn() {
			zoom = Math.min(8, zoom * 2);
			update();
			zoomStateCallback();
		}
		function zoomOut() {
			zoom = Math.max(1 / 8, zoom / 2);
			update();
			zoomStateCallback();
		}
		LIB.css(div, {
			width: width + "px",
			height: height + "px",
			backgroundColor: UI.theme.bgCol,
			cursor: "crosshair",
			overflow: "hidden",
			position: "relative"
		});
		LIB.css(canvasWrapper, {
			position: "absolute",
			left: "0",
			top: "0",
			transition: "all 0.3s ease-in-out",
			transformOrigin: "0 0"
		});
		LIB.css(zoomWrapper, {
			position: "absolute"
		});
		canvasWrapper.appendChild(canvas);
		zoomWrapper.appendChild(canvasWrapper);
		div.appendChild(zoomWrapper);
		update();
		LIB.attachMouseListener(div, function (val) {
			var canvasSize, x, y;
			if (val.delta >= 1) {
				zoomIn();
			}
			if (val.delta <= -1) {
				zoomOut();
			}
			gestureHandler.add(val);
			if (mode === MODE_HAND || val.code === 1 || keys.spacePressed) {
				setCursor(CURSOR_HAND);
				if (val.dragdone === false) {
					translate.x += val.dX / zoom;
					translate.y += val.dY / zoom;
					update();
				}
			} else {
				setCursor(CURSOR_CROSSHAIR);
				if (val.dragdone === false && val.code === 0) {
					canvasSize = canvas.getSize();
					x = canvasSize.width / 2 - (width / 2 - val.absX) / zoom - translate.x;
					y = canvasSize.height / 2 - (height / 2 - val.absY) / zoom - translate.y;
					callback({
						x: x,
						y: y,
						down: val.down,
						dragdone: false
					});
				}
				if (val.dragdone === true && val.code === 0) {
					callback({
						dragdone: true
					});
				}
			}
		});
		//interface
		this.reset = function () {
			reset();
		};
		this.resize = function (p) {
			width = p.width;
			height = p.height;
			LIB.css(div, {
				width: width + "px",
				height: height + "px"
			});
			update();
		};
		this.zoomIn = function () {
			zoomIn();
		};
		this.zoomOut = function () {
			zoomOut();
		};
		this.setHandTool = function (p) {
			if (p) {
				mode = MODE_HAND;
			} else {
				mode = MODE_DRAWING;
			}
		};
		this.getDiv = function () {
			return div;
		};
	}
	/*WebchemyCanvas
	Canvas consisting of an html canvas element and svg element on top.
	clear({width: , height: })		clear/init the canvas
	copyCanvasContext()				Returns a context of a canvas that is a copy of the original
	addShape(<svg element>)			Appends a shape to the svg element
	addDef(<svg def>)				Appends a definition to the svg element
	removeShape(<svg element>)		Removes the shape
	removerDef(<svg def>)			Removes the definition
	getDiv()						Returns the div element containing the canvas and svg element
	getContext()					Returns context of canvas
	getSize()						Returns width, height of canvas {width:, height: }
	*/
	function WebchemyCanvas() {
		var div, retina, width, height, canvas, context, svgContainer, svg, defs;
		div = document.createElement("div");
		retina = false; //window.devicePixelRatio > 1 ? true : false; //too slow on macbook pro and ipad
		canvas = document.createElement("canvas");
		context = canvas.getContext("2d");
		if (retina) {
			context.scale(2, 2);
			//now all drawing operations that follow have the correct drawing scale
		}
		svgContainer = document.createElement("div");

		function buildSVG() {
			svgContainer.innerHTML = "";
			svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
			svg.setAttribute('style', 'pointer-events: none');
			svg.setAttribute('width', width);
			svg.setAttribute('height', height);
			svg.setAttributeNS("http://www.w3.org/2000/xmlns/", "xmlns:xlink", "http://www.w3.org/1999/xlink");
			svgContainer.appendChild(svg);
			defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
			svg.appendChild(defs);
		}
		//style
		LIB.css(svgContainer, {
			position: "absolute",
			left: "0",
			top: "0",
			pointerEvents: "none"
		});
		LIB.css(div, {
			background: "#fff"
		});
		div.appendChild(canvas);
		div.appendChild(svgContainer);
		this.clear = function (p) {
			width = Math.max(10, Math.min(3000, p.width));
			height = Math.max(10, Math.min(3000, p.height));
			canvas.width = (retina) ? (2 * width) : width;
			canvas.height = (retina) ? (2 * height) : height;
			context.canvas.getContext("2d");
			if (retina) {
				context.scale(2, 2);
			}
			context.fillStyle = "rgba(255, 255, 255, 1)";
			context.fillRect(0, 0, canvas.width, canvas.height);
			LIB.css(div, {
				width: width + "px",
				height: height + "px",
				position: "relative"
			});
			LIB.css(canvas, {
				width: width + "px",
				height: height + "px"
			});
			div.getSize = function () {
				return {
					width: width,
					height: height
				};
			};
			buildSVG();
		};
		this.copyCanvasContext = function () {
			var canvas2, ctx;
			canvas2 = document.createElement("canvas");
			canvas2.width = (retina) ? (2 * width) : width;
			canvas2.height = (retina) ? (2 * height) : height;
			ctx = canvas2.getContext("2d");
			ctx.drawImage(canvas, 0, 0);
			if (retina) {
				ctx.scale(2, 2);
			}
			return ctx;
		};
		this.addShape = function (c) {
			svg.appendChild(c);
		};
		this.removeShape = function (c) {
			svg.removeChild(c);
		};
		this.addDef = function (c) {
			defs.appendChild(c);
		};
		this.removeDef = function (c) {
			defs.removeChild(c);
		};
		this.getDiv = function () {
			return div;
		};
		this.getContext = function () {
			return context;
		};
		this.getSize = function () {
			return {
				width: width,
				height: height
			};
		};
	}
	/*WebchemyBrush(p)
	Creates all the svg shapes and draws them onto a canvas. Has a number of settings (size, mode, mirror, gradient, etc)
	p = {
		width: <number>		Width of canvas in px
		height: <number>	Height of canvas in px
	}
	startLine({x: , y: })						Line start (mouse down, touch start)
	goLine({x: , y: })							Line continues (dragging)
	endLine()									Line ends (mouse up, touch release)
	drawActionOnContext({action: , context: })	draw an action(created by this brush) onto a context(of canavs)
	setSize({width: , height: })				Set with, height of canvas in px					
	isDrawing()									True/false is the brush drawing
	getAction()									Returns current action
	update(p_update)							Update brush settings
	update p_update = {
		color: {r: , g: , b: }		Updating selected color
		zoom: <number>				Current zoom factor of view
		gradient: <boolean>			Gradient on/off
		splat: <boolean>			Splat on/off
		mirrorHorizontal: <boolean>	Mirror Horizontal on/off
		mirrorVertical: <boolean>	Mirror Vertical on/off
		mode: <string>				"MODE_FILL" or "MODE_STROKE" brush mode update
		opacity: <number[0,1]>		Opacity of brush updated
		size: <number [0, 1]>		Size/width of brush updated
	}
	*/
	function WebchemyBrush(p) {
		var MODE_FILL, MODE_STROKE, color, size, opacity, mode, width, height, mirrorHorizontal, mirrorVertical,
			gradient, splat, zoom, drawing, action, shapeCounter, inputHandler;
		MODE_FILL = 0;
		MODE_STROKE = 1;
		color = {
			r: 0,
			g: 0,
			b: 0
		};
		size = 1;
		opacity = 1;
		mode = MODE_FILL;
		width = p.width;
		height = p.height;
		mirrorHorizontal = true;
		mirrorVertical = false;
		gradient = false;
		splat = false;
		zoom = 1;
		drawing = false; //state
		shapeCounter = 0;
		inputHandler = (function () {
			var result, smooth, data, bezier, lastIn, minY, maxY, lastCheck;
			result = {};
			smooth = 0.8;
			data = [];
			lastCheck = 0;
			result.add = function (p) {
				var dist, x, y, displace;
				if (bezier === undefined) {
					bezier = new LIB.BezierLine();
					bezier.add(p.x, p.y);
					minY = p.y;
					maxY = p.y;
				} else {
					dist = LIB.Vec2.dist(lastIn, {
						x: p.x,
						y: p.y
					});
					if (dist < 10 / zoom) {
						return false;
					}
					if (splat) {
						displace = LIB.Vec2.add({
							x: p.x,
							y: p.y
						}, LIB.Vec2.mul(LIB.Vec2.sub({
							x: p.x,
							y: p.y
						}, lastIn), -1 * Math.max(Math.min(15, dist * 0.2 * zoom), 1.5)));
						x = displace.x;
						y = displace.y;
					} else {
						x = lastIn.x * (1 - smooth) + p.x * smooth;
						y = lastIn.y * (1 - smooth) + p.y * smooth;
					}
					minY = Math.min(minY, y);
					maxY = Math.max(maxY, y);
					bezier.add(x, y);
				}
				lastIn = {
					x: p.x,
					y: p.y
				};
				return true;
			};
			result.clear = function () {
				bezier = undefined;
			};
			result.getData = function () {
				var i, points;
				points = [];
				if (bezier) {
					points = bezier.getPoints();
					for (i = lastCheck; i < points.length; i += 1) {
						if (points[i].c1) {
							minY = Math.min(minY, points[i].c1.y);
							maxY = Math.max(maxY, points[i].c1.y);
							minY = Math.min(minY, points[i].c2.y);
							maxY = Math.max(maxY, points[i].c2.y);
						}
					}
					lastCheck = i;
				}
				return points;
			};
			result.getMinY = function () {
				return minY;
			};
			result.getMaxY = function () {
				return maxY;
			};
			return result;
		}());

		function setAttributes(el, attr) {
			var i = 0;
			for (i = 0; i < attr.length; i += 1) {
				el.setAttribute(attr[i][0], attr[i][1]);
			}
		}
		//interface
		this.update = function (p) {
			if (p.zoom) {
				zoom = p.zoom;
			}
			if (p.splat !== undefined) {
				splat = p.splat;
			}
			if (p.color !== undefined) {
				color = {
					r: 0,
					g: 0,
					b: 0
				};
				color.r = parseInt(p.color.r, 10);
				color.g = parseInt(p.color.g, 10);
				color.b = parseInt(p.color.b, 10);
			}
			if (p.opacity !== undefined) {
				opacity = Math.max(0.05, Math.min(1, p.opacity));
			}
			if (p.size !== undefined) {
				size = 40 * Math.pow(p.size, 2) + 1;
			}
			if (p.mode === "MODE_FILL") {
				mode = MODE_FILL;
			}
			if (p.mode === "MODE_STROKE") {
				mode = MODE_STROKE;
			}
			if (p.gradient !== undefined) {
				gradient = p.gradient;
			}
			if (p.mirrorHorizontal !== undefined) {
				if (p.mirrorHorizontal) {
					mirrorVertical = false;
				}
				mirrorHorizontal = p.mirrorHorizontal;
			}
			if (p.mirrorVertical !== undefined) {
				if (p.mirrorVertical) {
					mirrorHorizontal = false;
				}
				mirrorVertical = p.mirrorVertical;
			}
		};
		this.startLine = function (p) {
			var stop0, stop1, mshape, brushCol;
			action = {};
			action.mode = parseInt(mode, 10);
			action.color = color;
			action.size = size;
			action.opacity = opacity;
			action.splat = splat;
			action.gradient = gradient;
			action.mirrorHorizontal = mirrorHorizontal;
			action.mirrorVertical = mirrorVertical;
			inputHandler.add(p);
			action.input = inputHandler.getData();
			action.svgDefs = [];
			action.svgShapes = [];
			brushCol = LIB.color.rgbToHex(color);
			if (gradient) {
				brushCol = 'url(#grad' + shapeCounter + ')';
				action.svgDefs[0] = document.createElementNS("http://www.w3.org/2000/svg", "linearGradient");
				setAttributes(action.svgDefs[0], [
					["id", "grad" + shapeCounter],
					["x1", "0%"],
					["y1", "0%"],
					["x2", "0%"],
					["y2", "100%"]
				]);
				stop0 = document.createElementNS("http://www.w3.org/2000/svg", "stop");
				setAttributes(stop0, [
					["offset", "0%"],
					["style", "stop-opacity: 0; stop-color: " + LIB.color.rgbToHex(color)]
				]);
				stop1 = document.createElementNS("http://www.w3.org/2000/svg", "stop");
				setAttributes(stop1, [
					["offset", "100%"],
					["style", "stop-opacity: 1; stop-color: " + LIB.color.rgbToHex(color)]
				]);
				action.svgDefs[0].appendChild(stop0);
				action.svgDefs[0].appendChild(stop1);
			}
			action.svgShapes[0] = document.createElementNS("http://www.w3.org/2000/svg", "path");
			setAttributes(action.svgShapes[0], [
				["id", "drawing" + shapeCounter]
			]);
			if (mode === MODE_STROKE) {
				setAttributes(action.svgShapes[0], [
					["stroke", brushCol],
					["stroke-opacity", opacity],
					["stroke-width", size],
					["fill", "none"],
					["stroke-linecap", "round"],
					["stroke-linejoin", "round"]
				]);
			} else {
				setAttributes(action.svgShapes[0], [
					["id", "drawing" + shapeCounter],
					["fill", brushCol],
					["fill-opacity", opacity]
				]);
			}
			if (mirrorHorizontal) {
				mshape = document.createElementNS("http://www.w3.org/2000/svg", "use");
				mshape.setAttributeNS("http://www.w3.org/1999/xlink", "xlink:href", "#drawing" + shapeCounter);
				setAttributes(mshape, [
					["x", -width],
					["y", 0],
					["transform", "scale(-1, 1)"]
				]);
				action.svgShapes.push(mshape);
			}
			if (mirrorVertical) {
				mshape = document.createElementNS("http://www.w3.org/2000/svg", "use");
				mshape.setAttributeNS("http://www.w3.org/1999/xlink", "xlink:href", "#drawing" + shapeCounter);
				setAttributes(mshape, [
					["x", 0],
					["y", -height],
					["transform", "scale(1, -1)"]
				]);
				action.svgShapes.push(mshape);
			}
			shapeCounter += 1;
			drawing = true;
		};
		this.goLine = function (p) {
			var i, dat, pathString;
			inputHandler.add(p);
			action.input = inputHandler.getData();
			if (action.input.length < 2) {
				return;
			}
			if (action.gradient) {
				if (action.input[0].x > action.input[action.input.length - 1].x) {
					action.y1 = inputHandler.getMaxY();
					action.y2 = inputHandler.getMinY();
					action.svgDefs[0].setAttribute("y1", "100%");
					action.svgDefs[0].setAttribute("y2", "0%");
				} else {
					action.y1 = inputHandler.getMinY();
					action.y2 = inputHandler.getMaxY();
					action.svgDefs[0].setAttribute("y1", "0%");
					action.svgDefs[0].setAttribute("y2", "100%");
				}
			}
			pathString = "M";
			for (i = 0; i < action.input.length - 1; i += 1) {
				dat = action.input[i];
				pathString += " ";
				if (i === 0) {
					if (splat) {
						pathString += dat.x + "," + dat.y + " L " + dat.c1.x + "," + dat.c1.y + " " + dat.c2.x + "," + dat.c2.y;
					} else {
						pathString += dat.x + "," + dat.y + " C " + dat.c1.x + "," + dat.c1.y + " " + dat.c2.x + "," + dat.c2.y;
					}
				} else if (i === action.input.length - 2) {
					pathString += dat.x + "," + dat.y;
				} else {
					pathString += dat.x + "," + dat.y + " " + dat.c1.x + "," + dat.c1.y + " " + dat.c2.x + "," + dat.c2.y;
				}
			}
			action.svgShapes[0].setAttribute("d", pathString);
		};
		this.endLine = function () {
			drawing = false;
			inputHandler.clear();
			if (action.input.length < 2) {
				action = undefined; //action won't be applied
			}
		};
		this.drawActionOnContext = function (p) {
			var i, dat, grad, context, a;
			context = p.context;
			a = p.action;
			context.save();
			function curveTo(x1, y1, x2, y2, x3, y3) {
				if (a.splat) {
					context.lineTo(x1, y1);
					context.lineTo(x2, y2);
					context.lineTo(x3, y3);
				} else {
					context.bezierCurveTo(x1, y1, x2, y2, x3, y3);
				}
			}
			if (a.mode === MODE_STROKE) {
				context.strokeStyle = "rgba(" + a.color.r + ", " + a.color.g + ", " + a.color.b + ", " + a.opacity + ")";
				context.lineWidth = a.size;
				context.lineJoin = "round";
				context.lineCap = "round";
			} else {
				context.fillStyle = "rgba(" + a.color.r + ", " + a.color.g + ", " + a.color.b + ", " + a.opacity + ")";
			}
			if (a.gradient) {
				grad = context.createLinearGradient(0, a.y1, 0, a.y2);
				grad.addColorStop(0, "rgba(" + a.color.r + ", " + a.color.g + ", " + a.color.b + ", 0)");
				grad.addColorStop(1, "rgba(" + a.color.r + ", " + a.color.g + ", " + a.color.b + ", " + a.opacity + ")");
				context.fillStyle = grad;
				context.strokeStyle = grad;
			}

			function drawPath() {
				context.beginPath();
				for (i = 0; i < a.input.length - 2; i += 1) {
					dat = a.input[i];
					if (i === 0) {
						context.moveTo(dat.x, dat.y);
					}
					curveTo(dat.c1.x, dat.c1.y, dat.c2.x, dat.c2.y, dat.c3.x, dat.c3.y);
				}
				if (a.mode === MODE_STROKE) {
					context.stroke();
				} else {
					context.fill();
				}
			}
			drawPath();
			if (a.mirrorHorizontal) {
				context.save();
				context.translate(width, 0);
				context.scale(-1, 1);
				drawPath();
				context.restore();
			}
			if (a.mirrorVertical) {
				context.save();
				context.translate(0, height);
				context.scale(1, -1);
				drawPath();
				context.restore();
			}
			context.restore();
		};
		this.setSize = function (p) {
			width = p.width;
			height = p.height;
		};
		this.getAction = function () {
			return action;
		};
		this.isDrawing = function () {
			return drawing;
		};
	}
	/*WebchemyTools(p)
	Object that manages the brush and WebchemyCanvas, and handles undo, redo, export, etc.
	p = {
		width: <number>				Width of canvas in px
		height: <number>			Height of canvas in px
		callback: <function(evt)>	Callback informing about changing undo/redo action count
	}
	callback evt = {
		undoCount: <number>			Maximum undo steps
		redoCount: <number>			Maximum redo steps
	}
	clear()							Clear the canvas
	undo()							Undo action
	redo()							Redo action
	onInput(evt)					Send input events (x, y, down, dragdone)
	updateBrush(p)					Calls update(p) for the WebchemyBrush
	setSize({width:, height: })		Update width/height of the canvas, will be used on next clear()
	getCanvasDiv()					Returns div element of the WebchemyCanvas
	getCanvasImage()				Returns canvas object of the WebchemyCanvas
	getSVGString()					Returns string of complete svg element
	*/
	function WebchemyTools(p) {
		var callback, width, height, canvas, context, brush, svgOut, MAX_UNDO, undoStack, redoStack;
		callback = p.callback;
		width = p.width;
		height = p.height;
		canvas = new WebchemyCanvas();
		canvas.clear({
			width: width,
			height: height
		});
		context = canvas.getContext();
		brush = new WebchemyBrush({
			width: width,
			height: height
		});
		svgOut = {
			defs: "",
			shapes: ""
		};
		MAX_UNDO = 4;
		undoStack = [];
		redoStack = [];

		function undoStateCallback() {
			callback({
				undoCount: undoStack.length,
				redoCount: redoStack.length
			});
		}

		function addActionShapes(p) {
			var i;
			for (i = 0; i < p.svgDefs.length; i += 1) {
				canvas.addDef(p.svgDefs[i]);
			}
			for (i = 0; i < p.svgShapes.length; i += 1) {
				canvas.addShape(p.svgShapes[i]);
			}
		}

		function removeActionShapes(p) {
			var i;
			for (i = 0; i < p.svgDefs.length; i += 1) {
				canvas.removeDef(p.svgDefs[i]);
			}
			for (i = 0; i < p.svgShapes.length; i += 1) {
				canvas.removeShape(p.svgShapes[i]);
			}
		}

		function serializeAction(p) {
			var i, oSerializer, result;
			oSerializer = new window.XMLSerializer();
			result = {
				defs: "",
				shapes: ""
			};
			for (i = 0; i < p.svgDefs.length; i += 1) {
				result.defs += oSerializer.serializeToString(p.svgDefs[i]).replace(" href", " xlink:href").replace('xmlns:xlink="http://www.w3.org/1999/xlink"', "").replace('xmlns="http://www.w3.org/2000/svg"', "") + "\n";
			}
			for (i = 0; i < p.svgShapes.length; i += 1) {
				result.shapes += oSerializer.serializeToString(p.svgShapes[i]).replace(" href", " xlink:href").replace('xmlns:xlink="http://www.w3.org/1999/xlink"', "").replace('xmlns="http://www.w3.org/2000/svg"', "") + "\n";
			}
			return result;
		}
		//interface
		this.clear = function () {
			canvas.clear({
				width: width,
				height: height
			});
			brush.setSize({
				width: width,
				height: height
			});
			undoStack = [];
			redoStack = [];
			svgOut = {
				defs: "",
				shapes: ""
			};
			undoStateCallback();
		};
		this.undo = function () {
			var action;
			if (brush.isDrawing() || undoStack.length === 0) {
				return;
			}
			action = undoStack.pop();
			removeActionShapes(action);
			redoStack.push(action);
			undoStateCallback();
		};
		this.redo = function () {
			var action;
			if (brush.isDrawing() || redoStack.length === 0) {
				return;
			}
			action = redoStack.pop();
			addActionShapes(action);
			undoStack.push(action);
			undoStateCallback();
		};
		this.onInput = function (p) {
			var action, DRAW_NATIVE, serA, cSize;
			DRAW_NATIVE = false;
			if (p.down) {
				brush.startLine({
					x: p.x,
					y: p.y
				});
				action = brush.getAction();
				addActionShapes(action);
			} else if (p.dragdone === false) {
				brush.goLine({
					x: p.x,
					y: p.y
				});
			} else if (p.dragdone) {
				action = brush.getAction();
				brush.endLine();
				if (brush.getAction() === undefined) {
					removeActionShapes(action);
				} else {
					redoStack = [];
					undoStack.push(action);
					if (undoStack.length > MAX_UNDO) {
						action = undoStack.shift();
						serA = serializeAction(action);
						svgOut.defs += serA.defs;
						svgOut.shapes += serA.shapes;
						if (DRAW_NATIVE) {
							cSize = canvas.getSize();
							LIB.drawSVGToContext({
								width: cSize.width,
								height: cSize.height,
								context: context,
								defs: serA.defs,
								shapes: serA.shapes,
								callback: function () {
									removeActionShapes(action);
								}
							});
						} else {
							removeActionShapes(action);
							brush.drawActionOnContext({
								context: context,
								action: action
							});
						}
					}
					undoStateCallback();
				}
			}
		};
		//mode, modifiers, zoom, color, etc
		this.updateBrush = function (p) {
			brush.update(p);
		};
		this.setSize = function (p) {
			width = p.width;
			height = p.height;
		};
		this.getCanvasDiv = function () {
			return canvas.getDiv();
		};
		this.getCanvasImage = function () {
			var i, ctx;
			ctx = canvas.copyCanvasContext();
			for (i = 0; i < undoStack.length; i += 1) {
				brush.drawActionOnContext({
					context: ctx,
					action: undoStack[i]
				});
			}
			return ctx.canvas;
		};
		this.getSVGString = function () {
			var i, cSize, svgStart, outDefs, outShapes, serA;
			cSize = canvas.getSize();
			svgStart = '<?xml version="1.0" encoding="UTF-8" standalone="no"?> \n' + '<svg \n' + 'xmlns:dc="http://purl.org/dc/elements/1.1/" \n' + 'xmlns:cc="http://creativecommons.org/ns#" \n' + 'xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" \n' + 'xmlns:svg="http://www.w3.org/2000/svg" \n' + 'xmlns="http://www.w3.org/2000/svg" \n' + 'xmlns:xlink="http://www.w3.org/1999/xlink" \n' + 'width="' + cSize.width + '" \n' + 'height="' + cSize.height + '" \n' + 'id="svg3112" \n' + 'version="1.1">';
			outDefs = svgOut.defs.toString();
			outShapes = svgOut.shapes.toString();
			for (i = 0; i < undoStack.length; i += 1) {
				serA = serializeAction(undoStack[i]);
				outDefs += serA.defs;
				outShapes += serA.shapes;
			}
			return svgStart + "<defs>" + outDefs + "</defs>" + outShapes + "</svg>";
		};
	}
	/*WebchemyApp(p)
	The complete Webchemy App. If p is undefined, will init fullscreen mode.
	p = {
		target: <div>		Div element the WebchemyApp will be appended to
		width: <number>		Width of app in px
		height: <number>	Height of app in px
	}
	resize({width: , height: })		Resize the app
	getCanvas()						Returns a canvas object of the current drawing
	getSVGString()					Returns the string of the complete svg element
	*/
	function WebchemyApp(p) {
		var fullscreen, target, width, height, webchemyDiv, wcDivClass, tools, view, bar,
			barDiv, barHidden;
		barHidden = false;
		wcDivClass = "WebchemyAppMainDiv";
		fullscreen = true;
		target = document.body;
		width = window.innerWidth;
		height = window.innerHeight;
		//apply parameters
		if (p && p.target) {
			target = p.target;
			fullscreen = false;
			width = p.width;
			height = p.height;
		}
		//create tools, view and bar
		webchemyDiv = document.createElement("div");
		webchemyDiv.className = wcDivClass;
		webchemyDiv.onmousedown = function () {
			return false;
		};
		webchemyDiv.oncontextmenu = function () {
			return false;
		};
		tools = new WebchemyTools({
			width: width,
			height: height,
			callback: function (val) {
				if (val.undoCount !== undefined && val.redoCount !== undefined) {
					bar.update({
						undoCount: val.undoCount,
						redoCount: val.redoCount
					});
				}
			}
		});
		view = new WebchemyCanvasView({
			width: width,
			height: height,
			canvas: tools.getCanvasDiv(),
			callback: function (val) {
				if (val.zoom !== undefined) {
					tools.updateBrush({
						zoom: val.zoom
					});
					bar.update({
						zoom: val.zoom,
						maxZoom: val.maxZoom,
						minZoom: val.minZoom
					});
					return;
				}
				if (val.undo) {
					tools.undo();
					return;
				}
				if (!bar.isHidden()) {
					bar.update({
						collapse: true
					});
				}
				if (val.singleTap && fullscreen) {
					bar.update({
						toggleHide: true
					});
				}
				tools.onInput(val);
			}
		});
		bar = new WebchemyBar({
			parent: webchemyDiv,
			callback: function (val) {
				var BB, bb, finalim;
				if (val.color) {
					tools.updateBrush({
						color: val.color
					});
				}
				if (val.clear) {
					tools.clear();
					view.reset();
				}
				if (val.exportSVG) {
					//var blob = new Blob([tools.getSVGString()], ["text/plain"]);
					BB = window.BlobBuilder || window.WebKitBlobBuilder || window.MozBlobBuilder;
					bb = new BB();
					bb.append(tools.getSVGString());
					window.saveAs(bb.getBlob("text/plain"), "Webchemy.svg");
					//window.saveAs(blob, "Webchemy.svg");
				}
				if (val.exportPNG) {
					finalim = tools.getCanvasImage();
					finalim.toBlob(function (blob) {
						window.saveAs(blob, "Webchemy.png");
					}, "image/png");
				}
				if (val.undo) {
					tools.undo();
				}
				if (val.redo) {
					tools.redo();
				}
				if (val.zoomIn) {
					view.zoomIn();
				}
				if (val.zoomOut) {
					view.zoomOut();
				}
				if (val.handTool !== undefined) {
					view.setHandTool(val.handTool);
				}
				if (val.gradient !== undefined) {
					tools.updateBrush({
						gradient: val.gradient
					});
				}
				if (val.splat !== undefined) {
					tools.updateBrush({
						splat: val.splat
					});
				}
				if (val.mirrorHorizontal !== undefined) {
					tools.updateBrush({
						mirrorHorizontal: val.mirrorHorizontal
					});
				}
				if (val.mirrorVertical !== undefined) {
					tools.updateBrush({
						mirrorVertical: val.mirrorVertical
					});
				}
				if (val.brushMode === "stroke") {
					tools.updateBrush({
						mode: "MODE_STROKE"
					});
				}
				if (val.brushMode === "fill") {
					tools.updateBrush({
						mode: "MODE_FILL"
					});
				}
				if (val.brushOpacity !== undefined) {
					tools.updateBrush({
						opacity: val.brushOpacity
					});
				}
				if (val.brushSize !== undefined) {
					tools.updateBrush({
						size: val.brushSize
					});
				}
			}
		});
		barDiv = bar.getDiv();
		//Styling
		function resize(w, h) {
			if (w === width && h === height) {
				return;
			}
			width = w;
			height = h;
			tools.setSize({
				width: width,
				height: height
			});
			view.resize({
				width: width,
				height: height
			});
			LIB.css(barDiv, {
				left: width / 2 + "px"
			});
			if (!fullscreen) {
				LIB.css(webchemyDiv, {
					width: width + "px",
					height: height + "px"
				});
			} else {
				LIB.css(webchemyDiv, {
					height: height + "px"
				});
			}
		}
		LIB.css(barDiv, {
			left: width / 2 + "px"
		});
		if (fullscreen) {
			window.addEventListener("resize", function () {
				resize(window.innerWidth, window.innerHeight);
			}, false);
		}
		LIB.css(webchemyDiv, {
			overflow: "hidden"
		});
		if (fullscreen) {
			LIB.css(webchemyDiv, {
				width: "100%",
				height: height + "px"
			});
		} else {
			LIB.css(webchemyDiv, {
				width: width + "px",
				height: height + "px",
				position: "relative"
			});
		}
		if (fullscreen) {
			LIB.addCssRule("body", "margin: 0px; overflow: hidden");
		}
		LIB.addCssRule("." + wcDivClass, "color: " + UI.theme.textColor + "; font-family: arial;");
		LIB.addCssRule("." + wcDivClass + " a", "color: " + UI.theme.linkColor + "; text-decoration: none; text-shadow: 1px 1px 1px #000;");
		LIB.addCssRule("." + wcDivClass + " a:hover", "color: " + UI.theme.linkHoverColor + ";");
		webchemyDiv.appendChild(view.getDiv());
		webchemyDiv.appendChild(barDiv);
		target.appendChild(webchemyDiv);
		//interface
		this.resize = function (w, h) {
			if (fullscreen) {
				return;
			}
			resize(w, h);
		};
		this.getCanvas = function () {
			return tools.getCanvasImage();
		};
		this.getSVGString = function () {
			return tools.getSVGString();
		};
	}
	return WebchemyApp;
}());