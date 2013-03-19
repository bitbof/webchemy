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
    var UI = {}, LIB = {}, requestAnimFrame, global;
    requestAnimFrame = (function () {
        return window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame || function (callback) {
            window.setTimeout(callback, 1000 / 60);
        };
    }());
    //a few "global" variables to manage fullscreen(on iPhone) and retina support
    global = {
        height: 0, //height of viewport/window
        forceFS: true, //true - hide address bar on touch, false - do nothing
        retina: false, //window.devicePixelRatio === 2 ? true : false //too slow on macbook pro and ipad 3rd gen
        isTouchDevice: false
    };
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
	Assign multiple style rules to one element. Automatically adds prefix for "transform", "transformOrigin",
	"transition", and "boxSizing"
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
                } else if (i === "boxSizing") {
                    el.style.WebkitBoxSizing = style[i];
                    el.style.MozBoxSizing = style[i];
                    el.style.boxSizing = style[i]; //ie, opera
                } else {
                    el.style[i] = style[i];
                }
            }
        }
    };

    /*LIB.color
	Basic color operations
	c is either {r: (0-255), g: (0-255), b: (0-255)} or {h: (0-360), s: (0-100), v: (0-100)}
	*/
    LIB.color = {
        rgbToHsv: function (c) {
            var result, r, g, b, minVal, maxVal, delta, del_R, del_G, del_B;
            result = {
                h: 0,
                s: 0,
                v: 0
            };
            r = Math.max(0, Math.min(255, c.r)) / 255;
            g = Math.max(0, Math.min(255, c.g)) / 255;
            b = Math.max(0, Math.min(255, c.b)) / 255;
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
            result = {
                r: 0,
                g: 0,
                b: 0
            };
            h = Math.max(0, Math.min(360, c.h)) / 360;
            s = Math.max(0.001, Math.min(100, c.s)) / 100; //bug if 0
            v = Math.max(0, Math.min(100, c.v)) / 100;
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
	/*LIB.setAttributes(el, attributes)
	set multiple attributes(array) for an element via setAttribute
	*/
    LIB.setAttributes = function (el, attr) {
        var i = 0;
        for (i = 0; i < attr.length; i += 1) {
            el.setAttribute(attr[i][0], attr[i][1]);
        }
    };
    /*LIB.getGlobalOff(el)
	Returns offset({x: , y: }) of DOM element relative to the origin of the page
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
	p = {src: <string>, callback: <function(strDataURL)>}
	Takes url of image and returns DataURL of that image via callback
	*/
    LIB.loadImageToDataURL = function (p) {
        var src, im;
        src = p.src;
        im = new Image();
        im.onload = function () {
            var canvas = document.createElement("canvas");
            canvas.width = im.width;
            canvas.height = im.height;
            canvas.getContext("2d").drawImage(im, 0, 0);
            p.callback(canvas.toDataURL("image/png"));
        };
        im.src = src;
    };
	/*LIB.setClickListener(p)
	Listens to mousedown and touchstart(quicker than onClick) and can spawn a glow effect for touch
	p = {
		el: <DOMElement>		Listening element
		glowPos: {x: , y: }		Coordinates relative to element origin where glow effect should spawn on touch (optional)
		callback: <function()>	Called on click. Return value(boolean) determines if glow will be visible
	}
	*/
    LIB.setClickListener = function (p) {
        p.el.onmousedown = function () {
            p.callback();
            return false;
        };
        p.el.ontouchstart = function (event) {
            var off;
            if (event.touches.length !== 1) {
                return false;
            }
            if (p.callback() !== false && p.glowPos) {
                off = LIB.getGlobalOff(p.el);
                UI.spawnGlow(off.x + p.glowPos.x, off.y + p.glowPos.y);
            }
            return false;
        };
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
		mode:			True on mousemove else undefined
		dragdone:		True/false when dragging, else undefined
		dX:				Delta x since last event in px, ONLY when dragging
		dY:				Delta y since last event in px, ONLY when dragging
		delta:			+/-0 ScrollWheel
		pageX:			pageX from event only when dragging
		pageY:			pageY from event only when dragging
		touch:			True when using touch
		
		pinch: {		Touch input with 2 fingers -> pinch gesture
			down:		Started pinch gesture
			dX:			Delta x of center point between both fingers
			dY:			Delta y of center point between both fingers
			absX:		Position of center point in px, element is the origin
			absY:		Position of center point in px, element is the origin
			dZoom:		Change of the zoom factor since the pinch/zoom gesture started (initially 1)
		}
	}
	*/
    LIB.attachMouseListener = function (el, callback) {
        var requested, inputData, wheel;
        if (!el || !callback) {
            return false;
        }
        requested = false;
        inputData = [];

        function handleInput() {
            while (inputData.length > 0) {
                callback(inputData.shift());
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
            var offset, x, y;
            if (document.onmousemove) {
                return false;
            }
            offset = LIB.getGlobalOff(el);
            x = event.pageX - offset.x;
            y = event.pageY - offset.y;
            push({
                event: event,
                x: limit(x / el.offsetWidth),
                y: limit(y / el.offsetHeight),
                over: true,
                absX: x,
                absY: y
            });
            return false;
        };
        el.onmouseout = function (event) {
            var offset, x, y;
            if (document.onmousemove) {
                return false;
            }
            offset = LIB.getGlobalOff(el);
            x = event.pageX - offset.x;
            y = event.pageY - offset.y;
            push({
                event: event,
                x: limit(x / el.offsetWidth),
                y: limit(y / el.offsetHeight),
                out: true,
                absX: x,
                absY: y
            });
            return false;
        };
        el.onmousemove = function (event) {
            var offset, x, y;
            if (document.onmousemove) {
                return false;
            }
            offset = LIB.getGlobalOff(el);
            x = event.pageX - offset.x;
            y = event.pageY - offset.y;
            push({
                event: event,
                x: limit(x / el.offsetWidth),
                y: limit(y / el.offsetHeight),
                move: true,
                absX: x,
                absY: y
            });
            return false;
        };
        el.onmousedown = function (event) {
            var offset, x, y, lastX, lastY, buttoncode;
            offset = LIB.getGlobalOff(el);
            x = event.pageX - offset.x;
            y = event.pageY - offset.y;
            lastX = x;
            lastY = y;
            buttoncode = event.button;
            push({
                event: event,
                x: limit(x / el.offsetWidth),
                y: limit(y / el.offsetHeight),
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
                    x: limit(x / el.offsetWidth),
                    y: limit(y / el.offsetHeight),
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
                    x: limit(x / el.offsetWidth),
                    y: limit(y / el.offsetHeight),
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

        function handlePinch(event) {
            var offset, x, y, lastX, lastY, dist, initialDist;
            offset = LIB.getGlobalOff(el);
            x = 0.5 * (event.touches[0].pageX - offset.x + event.touches[1].pageX - offset.x);
            y = 0.5 * (event.touches[0].pageY - offset.y + event.touches[1].pageY - offset.y);
            lastX = x;
            lastY = y;
            dist = LIB.Vec2.dist({
                x: event.touches[0].pageX,
                y: event.touches[0].pageY
            }, {
                x: event.touches[1].pageX,
                y: event.touches[1].pageY
            });
            initialDist = dist;
            push({
                event: event,
                pinch: {
                    down: true,
                    absX: x,
                    absY: y
                },
                absX: event.touches[0].pageX - offset.x,
                absY: event.touches[0].pageY - offset.y,
                touch: true
            });
            document.ontouchmove = function (event) {
                if (event.touches.length !== 2) {
                    return false;
                }
                x = 0.5 * (event.touches[0].pageX - offset.x + event.touches[1].pageX - offset.x);
                y = 0.5 * (event.touches[0].pageY - offset.y + event.touches[1].pageY - offset.y);
                dist = LIB.Vec2.dist({
                    x: event.touches[0].pageX,
                    y: event.touches[0].pageY
                }, {
                    x: event.touches[1].pageX,
                    y: event.touches[1].pageY
                });
                push({
                    event: event,
                    pinch: {
                        dX: x - lastX,
                        dY: y - lastY,
                        absX: x,
                        absY: y,
                        dZoom: dist / initialDist
                    },
                    absX: event.touches[0].pageX - offset.x,
                    absY: event.touches[0].pageY - offset.y,
                    touch: true
                });
                lastX = x;
                lastY = y;
                return false;
            };
        }
        el.ontouchstart = function (event) {
            var offset, x, y, lastX, lastY;
            if (event.touches.length === 2) {
                handlePinch(event);
                return false;
            }
            if (event.touches.length > 2) {
                return false;
            }
            offset = LIB.getGlobalOff(el);
            x = event.touches[0].pageX - offset.x;
            y = event.touches[0].pageY - offset.y;
            lastX = x;
            lastY = y;
            push({
                event: event,
                x: limit(x / el.offsetWidth),
                y: limit(y / el.offsetHeight),
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
                    return false;
                }
                x = event.touches[0].pageX - offset.x;
                y = event.touches[0].pageY - offset.y;
                push({
                    event: event,
                    x: limit(x / el.offsetWidth),
                    y: limit(y / el.offsetHeight),
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
                    x: limit(x / el.offsetWidth),
                    y: limit(y / el.offsetHeight),
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
            var delta, offset, x, y;
            delta = 0;
            if (!event) {
                event = window.event;
            }
            if (event.wheelDelta) {
                delta = event.wheelDelta / 120;
            } else if (event.detail) {
                delta = -event.detail / 3;
            }
            offset = LIB.getGlobalOff(el);
            x = event.pageX - offset.x;
            y = event.pageY - offset.y;
            push({
                event: event,
                x: limit(x / el.offsetWidth),
                y: limit(y / el.offsetHeight),
                delta: delta,
                absX: x,
                absY: y
            });
            return false;
        };
        el.onmousewheel = wheel;
        el.addEventListener('DOMMouseScroll', wheel, false);
        return true;
    };
    /*LIB.CatmullLine()
	Figures out additional control points that create a fairly smooth and natural line in real time(as you add points)
	add(x, y)		add a point
	getPoints()		returns you all points with additional control points between them like this:
	[{x:, y: , c1: {x: , y: }, c2: {x: , y: }, c3: next}, next, ...]
	*/
    LIB.CatmullLine = function () {
        var path, tension;
		path = [];
        tension = 1;
        this.add = function (x, y) {
            path.push({
                x: x,
                y: y
            });
        };
        this.getPoints = function () {
            var length, result, n, p1, p2, p3, p4;
			length = path.length - 3;
            if (length <= 0) {
                return [];
            }
            result = [];
            for (n = 0; n < path.length; n += 1) {
                p1 = path[n];
                p2 = path[Math.min(path.length - 1, n + 1)];
                p3 = path[Math.min(path.length - 1, n + 2)];
                p4 = path[Math.min(path.length - 1, n + 3)];
                if (n === 0) {
                    result[n] = {
                        x: p2.x,
                        y: p2.y
                    };
                }
                result[n].c1 = {
                    x: p2.x + (tension * p3.x - tension * p1.x) / 6,
                    y: p2.y + (tension * p3.y - tension * p1.y) / 6
                };
                result[n].c2 = {
                    x: p3.x + (tension * p2.x - tension * p4.x) / 6,
                    y: p3.y + (tension * p2.y - tension * p4.y) / 6
                };
                result[n].c3 = {
                    x: p3.x,
                    y: p3.y
                };
                result[n + 1] = {
                    x: p3.x,
                    y: p3.y
                };
            }
            return result;
        };
    };
	/*LIB.drawPathOnCanvas(pathObject, context)
	Draws a path string from svg onto a canvas via its context. Changes the
	pathObject to store parsed drawing instructions for quicker drawing.
	pathObject = {
		d: <string>			The path string from SVG
		parsed: <string>	Already parsed string(optional -> but will be written if not given)
	}
	Note: Some shapes cause hanging. Obviously the parsing isn't perfect.
	*/
    LIB.drawPathOnCanvas = function (pathObject, context) {
        var path, lastpos, i, p, p1, p2, mode;
		if (!pathObject.parsed) {
            pathObject.parsed = pathObject.d.split(" ");
        }
        path = pathObject.parsed;
        lastpos = [0, 0];
        i = 0;
        p = [0, 0]; //temp pos
        context.beginPath();
        while (i < path.length) {
            if (path[i] === "m") {
                p = path[i + 1].split(",");
                lastpos[0] += parseFloat(p[0]);
                lastpos[1] += parseFloat(p[1]);
                context.moveTo(lastpos[0], lastpos[1]);
                i += 2;
                mode = undefined;
            } else if (path[i] === "M") {
                p = path[i + 1].split(",");
                lastpos[0] = parseFloat(p[0]);
                lastpos[1] = parseFloat(p[1]);
                context.moveTo(lastpos[0], lastpos[1]);
                i += 2;
                mode = undefined;
            } else if (path[i] === "c") {
                mode = "curveRel";
                i += 1;
            } else if (path[i] === "l") {
                mode = "linearRel";
                i += 1;
            } else if (path[i] === "C") {
                mode = "curve";
                i += 1;
            } else if (path[i] === "L") {
                mode = "linear";
                i += 1;
            } else if (path[i] === "z" || path[i] === "Z") {
                context.closePath();
                i += 1;
                mode = undefined;
            }
            if (mode === "curveRel") {
                p = path[i].split(",");
                p1 = path[i + 1].split(",");
                p2 = path[i + 2].split(",");
                p[0] = lastpos[0] + parseFloat(p[0]);
                p[1] = lastpos[1] + parseFloat(p[1]);
                p1[0] = p[0] + parseFloat(p1[0]);
                p1[1] = p[1] + parseFloat(p1[1]);
                lastpos[0] = p1[0] + parseFloat(p2[0]);
                lastpos[1] = p1[1] + parseFloat(p2[1]);
                context.bezierCurveTo(p[0], p[1], p1[0], p1[1], lastpos[0], lastpos[1]);
                i += 3;
            } else if (mode === "linearRel") {
                p = path[i].split(",");
                lastpos[0] += parseFloat(p[0]);
                lastpos[1] += parseFloat(p[1]);
                context.lineTo(lastpos[0], lastpos[1]);
                i += 1;
            } else if (mode === "curve") {
                p = path[i].split(",");
                p1 = path[i + 1].split(",");
                p2 = path[i + 2].split(",");
                p[0] = parseFloat(p[0]);
                p[1] = parseFloat(p[1]);
                p1[0] = parseFloat(p1[0]);
                p1[1] = parseFloat(p1[1]);
                lastpos[0] = parseFloat(p2[0]);
                lastpos[1] = parseFloat(p2[1]);
                context.bezierCurveTo(p[0], p[1], p1[0], p1[1], lastpos[0], lastpos[1]);
                i += 3;
            } else if (mode === "linear") {
                p = path[i].split(",");
                lastpos[0] = parseFloat(p[0]);
                lastpos[1] = parseFloat(p[1]);
                context.lineTo(lastpos[0], lastpos[1]);
                i += 1;
            }
        }
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
        barCol: "#666",
        expandCol: "#444",
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
            ["btn_resetView.svg", 5, 0],
            ["btn_help.svg", 6, 0],
            ["btn_brushFill.svg", 6, 1],
            ["btn_brushStroke.svg", 0, 2],
            ["btn_more.svg", 2, 2],
            ["btn_export.svg", 4, 2],
            ["btn_fill.svg", 5, 2],
            ["btn_stroke.svg", 6, 2],
            ["btn_pull.svg", 5, 1],
            ["btn_gradientUp.svg", 0, 1],
            ["btn_flipHor.svg", 1, 1],
            ["btn_flipVert.svg", 2, 1],
            ["btn_splat.svg", 4, 1],
            ["btn_picker.svg", 0, 3],
            ["btn_swatch.svg", 1, 3],
            ["btn_colSlider.svg", 2, 3],
            ["btn_previous.svg", 3, 3],
            ["btn_next.svg", 4, 3]
        ]
    };
    /*UI.spawnGlow(x, y, parent)
	Animates a glow effect, useful for touch events (good visual feedback). The effect div
	will be automatically disposed.
	x, y - absolute coordinates where it should be placed
	parent - parent of the glow effect div
	*/
    UI.spawnGlow = (function () {
        //preload glowing effect
        var imCount, imArr;
        imCount = 0;
        imArr = [];
        imArr[0] = new Image();
        imArr[0].src = "glow.png";
        imArr[1] = new Image();
        imArr[1].src = "glow.png";
        imArr[2] = new Image();
        imArr[2].src = "glow.png";
        return function (x, y, parent) {
            var glow, prnt;
            glow = imArr[imCount];
            LIB.css(glow, {
                position: "absolute",
                left: (x - 64) + "px",
                top: (y - 64) + "px",
                width: "128px",
                height: "128px",
                transition: "opacity 0.2s linear",
                pointerEvents: "none",
                opacity: 1
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
            imCount = (imCount + 1) % imArr.length;
        };
    }());

    /*UI.spawnMessage(msg, parent)
	Creates a bar (within the parent) that comes down from the top with a message, and stays there until you
	remove it.
	msg - message to be displayed
	parent - parent of div containing message
	Returns function you need to call in order to remove the bar/message
	*/
    UI.spawnMessage = (function () {
        return function (msg, parent) {
            var div, bar, prnt, removed;
            div = document.createElement("div");
            bar = document.createElement("div");
            LIB.css(div, {
                position: "absolute",
                left: 0,
                top: 0,
                width: "100%",
                pointerEvents: "none"
            });
            LIB.css(bar, {
                marginLeft: "auto",
                marginRight: "auto",
                width: (UI.theme.halfBoxSize * 2 * 7) + "px",
                height: (UI.theme.halfBoxSize * 2) + "px",
                background: "rgba(0, 0, 0, 0.5)",
                transition: "margin 0.1s ease-out",
                marginTop: (-UI.theme.halfBoxSize * 2) + "px",
                opacity: 0.8,
                fontWeight: "bold",
                textAlign: "center",
                borderBottomRightRadius: (UI.theme.halfBoxSize / 3) + "px",
                borderBottomLeftRadius: (UI.theme.halfBoxSize / 3) + "px",
                color: "#fff",
                fontFamily: "arial",
                fontSize: (UI.theme.halfBoxSize * 2 / 3.0) + "px",
                lineHeight: (UI.theme.halfBoxSize * 2) + "px"
            });
            bar.innerHTML = msg;
            div.appendChild(bar);
            prnt = document.body;
            if (parent) {
                prnt = parent;
            }
            removed = false;
            prnt.appendChild(div);
            setTimeout(function () {
                LIB.css(bar, {
                    marginTop: 0
                });

            }, 10);
            return function () {
                if (!removed) {
                    removed = true;
                    prnt.removeChild(div);
                }
            };
        };
    }());
    /*UI.Button(p)
	Basic button
	P =	{
		im: <string>			Icon from UI.theme.svgGrid. Example: "btn_clear.svg"
		text: <string>			The alternative to an image
		title: <string>			Title attribute (tooltip on hover)
		animated: <boolean>,	Animates on pressing
		disabled: <boolean>,	Disable/enable button
		touchGlow: <boolean>,	Glow effect on touch
		style: {...}			Applies these style attributes to the button
		callback: <function()>	Gets called when pressed.
	}
	enable(<boolean>)			Enable/disable button
	setImage(<string>)			Change icon
	setTitle(<string>)			Sets title attribute (tooltip on hover)
	setTouchGlow(<boolean>)		Enable/disable touch glow effect
	getDiv()					Returns div element of button
	isEnabled()
	*/
    UI.Button = function (p) {
        var im, text, animated, disabled, touchGlow, callback, boxSize, div, innerDiv, mozInvertFilter;
        im = p.im;
        text = p.text;
        animated = p.animated || false;
        disabled = p.disabled || false;
        touchGlow = p.touchGlow || false;
        callback = p.callback;
        boxSize = 2 * UI.theme.halfBoxSize;
        div = document.createElement("div");
        innerDiv = document.createElement("div");
        div.appendChild(innerDiv);
        mozInvertFilter = "url(\"data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\'><filter id=\'grayscale\'><feComponentTransfer><feFuncR type=\'table\' tableValues=\'1 0\'/><feFuncG type=\'table\' tableValues=\'1 0\'/><feFuncB type=\'table\' tableValues=\'1 0\'/></feComponentTransfer></filter></svg>#grayscale\"";
        if (p.title) {
            div.title = p.title;
        }

        function updateBackground() {
            var bgScale, i, e, h, borderSize, scaleX, scaleY, offx, offy;
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
            scaleY = (boxSize * bgScale) * (4 * 3);
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
                backgroundImage: "url(" + UI.theme.buttonSVG + ")"
            });
            updateBackground();
        } else if (text) {
            LIB.css(innerDiv, {
                fontSize: (boxSize / 3.0) + "px",
                lineHeight: boxSize + "px",
                textAlign: "center",
                fontWeight: "bold",
                textShadow: "1px 2px 1px rgba(0, 0, 0, 0.5)"
            });
            innerDiv.innerHTML = text;
        }

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
                        transition: "all 0.1s ease-in",
                        transform: ""
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
            if (event.touches.length !== 1) {
                return false;
            }
            if (!disabled) {
                if (touchGlow) {
                    off = LIB.getGlobalOff(div);
                    UI.spawnGlow(off.x + boxSize / 2, off.y + boxSize / 2);
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
                opacity: 0.5 * UI.theme.opacityOff,
                cursor: "default",
                webkitFilter: "invert(1)",
                filter: mozInvertFilter
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
                        opacity: 0.5 * UI.theme.opacityOff,
                        cursor: "default",
                        webkitFilter: "invert(1)",
                        filter: mozInvertFilter
                    });
                } else {
                    LIB.css(div, {
                        opacity: 1,
                        cursor: "pointer",
                        webkitFilter: "",
                        filter: ""
                    });
                }
            }
        };
        this.setImage = function (p) {
            im = p;
            updateBackground();
        };
        this.setTitle = function (p) {
            if (p) {
                div.title = p;
            }
        };
		this.setTouchGlow = function (p) {
            touchGlow = p;
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
		state: <boolean>				Initial state: on/off
		im: <string>					Icon from UI.theme.svgGrid. Example: "btn_clear.svg"
		text: <string>					The alternative to an image
		title: <string>					Title attribute (tooltip on hover)
		animated: <boolean>				Animates on pressing
		disabled: <boolean>				Disable/enable button
		touchGlow: <boolean>			Glow effect on touch
		callback: <function(<boolean>)>	Gets called on turning on/off
	}
	setState(<boolean>)			Set state on/off
	getDiv()					Returns div element of button
	*/
    UI.ToggleButton = function (p) {
        var state, callback, button;
        state = p.state;
        callback = p.callback;

        function update() {
            LIB.css(button.getDiv(), {
                opacity: state ? 1 : UI.theme.opacityOff
            });
        }
        button = new UI.Button({
            im: p.im,
            text: p.text,
            title: p.title,
            touchGlow: p.touchGlow,
            animated: p.animated,
            disabled: p.disabled,
            callback: function () {
                state = !state;
                update();
                callback(state);
            }
        });
        update();
        this.setState = function (p) {
            if (p === state) {
                return;
            }
            state = !state;
            update();
        };
        this.getDiv = function () {
            return button.getDiv();
        };
    };
	/*UI.MultiStepSwitch(p)
	A button that lets you switch between multiple different items. Only one at a time
	can be selected.
	P =	{
		ims: [<string>,<string>,...]	Array containing n names of icons
		init: <int>						Index of item that is initially selected
		titles: [<string>,<string>,...]	Array containing n titles of icons
		width: <int>					Width in (halfBoxSize * 2) units
		callback: <function(<string>)>	Callback with id of selected item as parameter
	}
	getDiv()					Returns div element of the MultiStepSwitch
	*/
    UI.MultiStepSwitch = function (p) {
        var ims, state, titles, width, callback, boxPx, boxSize, div, modeBox, animated, icons, i;
		ims = p.ims;
        state = p.init;
        titles = p.titles;
        width = p.width;
        callback = p.callback;
        boxPx = UI.theme.halfBoxSize / 22;
		boxSize = UI.theme.halfBoxSize * 2;
		div = document.createElement("div");
        LIB.css(div, {
            width: (boxSize * width) + "px",
            height: boxSize + "px",
            cssFloat: "left",
            cursor: "pointer",
            position: "relative"
        });
        modeBox = document.createElement("div");
        LIB.css(modeBox, {
            border: (UI.theme.halfBoxSize / 11) + "px solid #777",
            position: "absolute",
            left: (boxPx * 3) + "px",
            top: (boxPx * 4) + "px",
            width: (boxSize * 3 - boxPx * 10) + "px",
            height: (boxSize - boxPx * 10) + "px",
            borderRadius: (boxPx * 5) + "px"
        });
        animated = document.createElement("div");
        LIB.css(animated, {
            position: "absolute",
            width: (boxSize - boxPx * 16) + "px",
            borderBottom: (2 * boxPx) + "px solid #999",
            transition: "left 0.1s ease-in-out",
            left: (boxSize + boxPx * 8) + "px",
            top: (boxSize - boxPx * 4) + "px"
        });
        div.appendChild(modeBox);
        div.appendChild(animated);

		icons = [];

        function updateBackground(icon, im) {
            var bgScale, i, e, h, borderSize, scaleX, scaleY, offx, offy;
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
            scaleY = (boxSize * bgScale) * (4 * 3);
            offx = -(boxSize * bgScale * 3 * i) + borderSize;
            offy = (boxSize * bgScale * 3 * e) - (scaleY - boxSize) - borderSize;
            LIB.css(icon, {
                backgroundSize: scaleX + "px " + scaleY + "px ",
                backgroundRepeat: "no-repeat",
                backgroundPosition: offx + "px " + offy + "px",
                width: boxSize + "px",
                height: boxSize + "px"
            });
        }

		function click(i) {
			var e;
            if (i === state) {
                state = (state + 1) % titles.length;
            } else {
                state = i;
            }
            LIB.css(animated, {
                left: (state * boxSize + boxPx * 8) + "px"
            });
            for (e = 0; e < ims.length; e += 1) {
                if (e !== state) {
                    icons[e].style.opacity = 0.5;
                } else {
                    icons[e].style.opacity = 1;
                }
            }
            callback(titles[state]);
        }

		function createIcon(i) {
			icons[i] = document.createElement("div");
			LIB.css(icons[i], {
				position: "absolute",
				left: ((i * width / ims.length) * boxSize) + "px",
				top: 0,
				background: "url(" + UI.theme.buttonSVG + ")"
			});
			if (i !== state) {
				icons[i].style.opacity = 0.5;
			}
			updateBackground(icons[i], ims[i]);
			icons[i].title = titles[i];
			icons[i].onmousedown = function () {
				click(i);
			};
			icons[i].ontouchstart = function (event) {
				var off, glowIndex;
				if (event.touches.length !== 1) {
					return false;
				}
				glowIndex = i;
				if (state === i) {
					glowIndex = (i + 1) % icons.length;
				}
				off = LIB.getGlobalOff(icons[glowIndex]);
				UI.spawnGlow(off.x + boxSize / 2, off.y + boxSize / 2);
				click(i);
				return false;
			};
			div.appendChild(icons[i]);
		}
        for (i = 0; i < ims.length; i += 1) {
            createIcon(i);
        }
        this.getDiv = function () {
            return div;
        };
    };
	/*UI.ClearCanvasButton(p)
	A clear-canvas button that lets you switch between different colors. Black and
	white are always one of these colors.
	can be selected.
	P =	{
		colors: [{r,g,b},{r,g,b},..]	Array of colors to choose from
		callback: <function({r,g,b})>	Callback (when pressing clear) with selected color as param
	}
	setColors([{r,g,b},{r,g,b},..])	Change the set of colors. Won't affect the currently
									selected color.
	getDiv()						Returns div element of button
	*/
    UI.ClearCanvasButton = function (p) {
		var div, boxSize, boxPx, colors, currentColor, currentColorValue, bgDiv, svg, path1,
			path2, clearDiv, prevDiv, nextDiv;
        div = document.createElement("div");
        boxSize = UI.theme.halfBoxSize * 2;
        boxPx = boxSize / 44;
        colors = p.colors;
        currentColor = 0;
        currentColorValue = {
            r: colors[currentColor].r,
            g: colors[currentColor].g,
            b: colors[currentColor].b
        };
        LIB.css(div, {
            cssFloat: "left",
            width: (3 * boxSize) + "px",
            position: "relative",
            cursor: "pointer"
        });
        bgDiv = document.createElement("div");
        LIB.css(bgDiv, {
            width: (boxSize * 3 - 12 * boxPx) + "px",
            height: (boxSize - 12 * boxPx) + "px",
            margin: (boxPx * 5) + "px",
            backgroundColor: "#fff",
            borderRadius: (boxPx * 10) + "px",
            border: boxPx + "px solid #aaa",
            transition: "background-color 0.2s linear"
        });
        div.appendChild(bgDiv);
        svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute('width', (boxSize * 3 - 12 * boxPx));
        svg.setAttribute('height', (boxSize - 12 * boxPx));
        svg.setAttributeNS("http://www.w3.org/2000/xmlns/", "xmlns:xlink", "http://www.w3.org/1999/xlink");
        LIB.css(svg, {
            position: "absolute",
            left: (boxPx * 6) + "px",
            top: (boxPx * 6) + "px"
        });
        path1 = document.createElementNS("http://www.w3.org/2000/svg", "path");
        LIB.setAttributes(path1, [
            ["d", "M 5,5 L 23,15 5,25 z"],
            ["stroke", "black"],
            ["stroke-opacity", 1],
            ["stroke-width", 1],
            ["fill", "none"],
            ["transform", "scale(" + boxPx + ", " + boxPx + ") translate(90 , 1)"]
        ]);
        path2 = document.createElementNS("http://www.w3.org/2000/svg", "path");
        LIB.setAttributes(path2, [
            ["d", "M 5,5 L 23,15 5,25 z"],
            ["stroke", "black"],
            ["stroke-opacity", 1],
            ["stroke-width", 1],
            ["fill", "none"],
            ["transform", "scale(" + (-boxPx) + ", " + boxPx + "), translate(-31, 1)"]
        ]);
        svg.appendChild(path1);
        svg.appendChild(path2);
        div.appendChild(svg);

        clearDiv = document.createElement("div");
        LIB.css(clearDiv, {
            position: "absolute",
            width: boxSize + "px",
            height: boxSize + "px",
            left: boxSize + "px",
            top: 0,
            fontSize: (boxSize / 3.0) + "px",
            textAlign: "center",
            lineHeight: boxSize + "px",
            fontWeight: "bold",
            color: "#000"
        });
        clearDiv.title = "Clear Canvas";
        clearDiv.innerHTML = "Clear";
        div.appendChild(clearDiv);

        prevDiv = document.createElement("div");
        LIB.css(prevDiv, {
            position: "absolute",
            width: boxSize + "px",
            height: boxSize + "px",
            left: 0,
            top: 0
        });
        prevDiv.title = "Previous Clear Color";
        div.appendChild(prevDiv);

        nextDiv = document.createElement("div");
        LIB.css(nextDiv, {
            position: "absolute",
            width: boxSize + "px",
            height: boxSize + "px",
            left: (2 * boxSize) + "px",
            top: 0
        });
        nextDiv.title = "Next Clear Color";
        div.appendChild(nextDiv);

        function clickChange(dir) {
            currentColor = (currentColor + dir + colors.length) % colors.length;
            currentColorValue = {
                r: colors[currentColor].r,
                g: colors[currentColor].g,
                b: colors[currentColor].b
            };
            var color = "#fff";
            if ((currentColorValue.r + currentColorValue.g + currentColorValue.b * 0.2) / 2.3 / 255 > 0.4) {
                color = "#000";
            }
            LIB.css(bgDiv, {
                backgroundColor: "rgb(" + currentColorValue.r + ", " + currentColorValue.g + ", " + currentColorValue.b + ")"
            });
            clearDiv.style.color = color;
            path1.setAttribute("stroke", color);
            path2.setAttribute("stroke", color);
        }
        prevDiv.onmousedown = function () {
            clickChange(-1);
        };
        prevDiv.ontouchstart = function (event) {
            var off;
            if (event.touches.length !== 1) {
                return false;
            }
            off = LIB.getGlobalOff(prevDiv);
            UI.spawnGlow(off.x + boxSize / 2, off.y + boxSize / 2);
            clickChange(-1);
            return false;
        };
        nextDiv.onmousedown = function () {
            clickChange(1);
        };
        nextDiv.ontouchstart = function (event) {
            var off;
            if (event.touches.length !== 1) {
                return false;
            }
            off = LIB.getGlobalOff(nextDiv);
            UI.spawnGlow(off.x + boxSize / 2, off.y + boxSize / 2);
            clickChange(1);
            return false;
        };
        clearDiv.onmousedown = function () {
            p.callback({
                clear: {
                    r: currentColorValue.r,
                    g: currentColorValue.g,
                    b: currentColorValue.b
                }
            });
        };
        clearDiv.ontouchstart = function (event) {
            var off;
            if (event.touches.length !== 1) {
                return false;
            }
            off = LIB.getGlobalOff(clearDiv);
            UI.spawnGlow(off.x + boxSize / 2, off.y + boxSize / 2);
            p.callback({
                clear: {
                    r: colors[currentColor].r,
                    g: colors[currentColor].g,
                    b: colors[currentColor].b
                }
            });
            return false;
        };

        function removeDuplicates() {
            var i, e;
            for (i = 0; i < colors.length; i += 1) {
                for (e = i + 1; e < colors.length; e += 1) {
                    if (colors[i].r === colors[e].r && colors[i].g === colors[e].g && colors[i].b === colors[e].b) {
                        colors.splice(e, 1);
                        e -= 1;
                    }
                }
            }
        }
        removeDuplicates();
        this.setColors = function (p) {
            colors = p;
            removeDuplicates();
        };
        this.getDiv = function () {
            return div;
        };
    };

    /*UI.ExpandButton(p)
	Button used together with expand bar. Pretty similar to a toggle button.
	P =	{
		im: <string>				Icon from UI.theme.svgGrid. Example: "btn_clear.svg"
		text: <string>				The alternative to an image
		title: <string>				Title attribute (tooltip on hover)
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
            title: p.title,
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
            border: (UI.theme.halfBoxSize / 11) + "px solid rgba(255, 255, 255, 0.1)",
            transition: "margin 0.1s, width 0.1s, height 0.1s, border 0.1s",
            borderRadius: "50%",
            boxShadow: "0 2px 4px rgba(0, 0, 0, 1) inset"
        });
        div.appendChild(colBox);

        function update() {
            if (expanded) {
                div.style.background = UI.theme.expandCol;
            } else {
                div.style.background = "";
            }
            LIB.css(colBox, {
                background: "rgb(" + color.r + ", " + color.g + ", " + color.b + ")"
            });
            if (active) {
                LIB.css(colBox, {
                    width: (boxSize * 0.75) + "px",
                    height: (boxSize * 0.75) + "px",
                    marginLeft: ((boxSize - boxSize * 0.75) / 2 - (UI.theme.halfBoxSize / 11)) + "px",
                    marginTop: ((boxSize - boxSize * 0.75) / 2 - (UI.theme.halfBoxSize / 11)) + "px",
                    border: (UI.theme.halfBoxSize / 11) + "px solid rgba(255, 255, 255, 1)"
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
            if (event.touches.length !== 1) {
                return false;
            }
            if (!active) {
                off = LIB.getGlobalOff(div);
                UI.spawnGlow(off.x + boxSize / 2, off.y + boxSize / 2);
            }
            click();
            return false;
        };
        update();
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
    };
    /*UI.ExpandBar(p)
	A bar on which new UI elements can be placed. Collapses and expands with an animation.
	Goes with ExpandButton/ColorButton.
	p = {
		width: <number>			width in grid units defined by UI.theme
		height: <number>		height in grid units defined by UI.theme
		leftOffset: <number>	Offset in (halfBoxSize * 2) units
	}
	collapse()		Collapse bar
	expand()		Expand bar
	isExpanded()	Returns boolean: true - expanded, false - collapsed
	getDiv()		Returns div element of bar (wrapped)
	getContentDiv()	Returns the inner div element where the UI elements go
	*/
    UI.ExpandBar = (function () {
        var classCounter = 0;
        return function (p) {
            var div, expanded, width, height, boxSize, hideTimeout, contentDiv, cssRule;
            div = document.createElement("div");
            expanded = false;
            boxSize = 2 * UI.theme.halfBoxSize;
            width = p.width * boxSize;
            height = p.height * boxSize;
            hideTimeout = undefined;
            //style
            LIB.css(div, {
                opacity: 0,
                position: "absolute",
                width: width + "px",
                left: ((p.leftOffset || 0) * boxSize) + "px",
                top: (boxSize - boxSize) + "px",
                transition: "all 0.1s ease-out",
                transform: "translate(0, " + (-height) + "px)",
                pointerEvents: "none"
            });
            div.ontouchstart = function () {
                return false;
            };

            contentDiv = document.createElement("div");
            contentDiv.className = "WebchemyAppShadedExpandBG" + classCounter;
            cssRule = "background-image: -webkit-linear-gradient(top, rgba(255,255,255, 0) " + (boxSize + 1) + "px, rgba(255,255,255, 0.2) " + (boxSize + 1 + boxSize) + "px);";
            cssRule += "background-image: -o-linear-gradient(top, rgba(255,255,255, 0) " + (boxSize + 1) + "px, rgba(255,255,255, 0.2) " + (boxSize + 1 + boxSize) + "px);";
            cssRule += "background-image: linear-gradient(to top, rgba(255,255,255, 0) " + (boxSize + 1) + "px, rgba(255,255,255, 0.2) " + (boxSize + 1 + boxSize) + "px);";
            cssRule += "background-image: -moz-linear-gradient(center top, rgba(255,255,255, 0) " + (boxSize + 1) + "px, rgba(255,255,255, 0.2) " + (boxSize + 1 + boxSize) + "px);";
            LIB.addCssRule("." + contentDiv.className, cssRule);
            classCounter += 1;
            LIB.css(contentDiv, {
                width: width + "px",
                height: height + "px",
                paddingTop: boxSize + "px",
                backgroundColor: UI.theme.expandCol,
                borderBottomRightRadius: (UI.theme.halfBoxSize / 3) + "px",
                borderBottomLeftRadius: (UI.theme.halfBoxSize / 3) + "px",
                boxShadow: "0 2px 4px rgba(0, 0, 0, 0.5)",
                backgroundImage: "-webkit-linear-gradient(top, rgba(255,255,255, 0) " + (boxSize + 1) + "px, rgba(255,255,255, 0.2) " + (boxSize + 1 + boxSize) + "px)"
            });
            div.appendChild(contentDiv);
            //needed so all images get loaded within each bar even before they are expanded
            setTimeout(function () {
                if (!expanded) {
                    LIB.css(contentDiv, {
                        display: "none"
                    });
                }
            }, 1000);

            function update() {
                if (!expanded) {
                    LIB.css(div, {
                        transform: "translate(0, " + (-height) + "px)",
                        opacity: 0,
                        pointerEvents: "none"
                    });
                } else {
                    LIB.css(div, {
                        transform: "translate(0, 0)",
                        opacity: 1,
                        pointerEvents: ""
                    });
                }
            }

            function expand(p) {
                if (expanded === p) {
                    return;
                }
                expanded = !expanded;
                if (expanded) {
                    clearTimeout(hideTimeout);
                    LIB.css(contentDiv, {
                        display: "block"
                    });
                    update();
                } else {
                    hideTimeout = setTimeout(function () {
                        LIB.css(contentDiv, {
                            display: "none"
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
            this.isExpanded = function () {
                return expanded;
            };
            this.getDiv = function () {
                return div;
            };
            this.getContentDiv = function () {
                return contentDiv;
            };
        };
    }());
    /*UI.EmptySlot(slots)
	Creates empty space with a width of: slots * halfBoxSize * 2
	getDiv()	Returns the div element
	*/
    UI.EmptySlot = function (p) {
        var div = document.createElement("div");
        LIB.css(div, {
            cssFloat: "left",
            height: (UI.theme.halfBoxSize * 2) + "px",
            width: (p * UI.theme.halfBoxSize * 2) + "px"
        });
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
        var div, value, callback, width, boxSize, border, enabled, eventDiv, circleDiv, hideTimeout,
			sliderSize, circleSize, fillDiv, slideBox, eventBox;
        div = document.createElement("div");
        value = p.value;
        callback = p.callback || function () {};
        width = p.width;
        div.innerHTML = p.caption;
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
            transition: "opacity 0.2s linear",
            fontSize: (border * 1.4) + "px",
            lineHeight: (border * 2) + "px",
            textAlign: "center",
            color: "#ccc",
            cursor: "default"
        });
        LIB.css(slideBox, {
            position: "absolute",
            backgroundColor: "#313131",
            width: (width - 2 * border) + "px",
            height: sliderSize + "px",
            borderRadius: (boxSize / 4) + "px",
            left: border + "px",
            top: (1.8 * border) + "px",
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
        LIB.css(eventBox, {
            position: "absolute",
            width: (width - 2 * border) + "px",
            height: sliderSize + "px",
            left: border + "px",
            top: (1.8 * border) + "px",
            cursor: "pointer"
        });
        if (!enabled) {
            LIB.css(div, {
                opacity: 0,
                pointerEvents: "none"
            });
        }
        div.appendChild(slideBox);
        div.appendChild(fillDiv);
        div.appendChild(circleDiv);
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
                div.style.opacity = 0;
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
	Creates a div with text.
	p = {
		text: <string>		The text you want to display
		width: <number>		Width of label in grid size
	}
	setText(<string>)	Changes the text
	getDiv()			Returns the div element
	*/
    UI.Label = function (p) {
        var div, width, boxSize;
        div = document.createElement("div");
        width = p.width;
        boxSize = UI.theme.halfBoxSize * 2;
        div.innerHTML = p.text;
        LIB.css(div, {
            cssFloat: "left",
            width: (width * boxSize) + "px",
            fontSize: (boxSize / 3.0) + "px",
            textAlign: "center",
            lineHeight: boxSize + "px",
            cursor: "default",
            color: UI.theme.labelColor
        });
        this.setText = function (p) {
            div.innerHTML = p;
        };
        this.getDiv = function () {
            return div;
        };
    };
    /*UI.showPopup(p)
	Displays an overlay/popup in the target element. Opening and closing takes 0.3 seconds (fade in, out)
	p = {
		target: <div>			Element this pop-up gets appended to
		div: <div>				Content you want to display
		callback: <function()>	(Optional) Will get called when the pop-up gets closed (pop-up can do that by itself)
		setCallback: <function(<function()>)>	Tells you what function to call to close the pop-up
	}
	*/
    UI.showPopup = (function () {
        var popDiv;
        return function (p) {
            var close, closed;
            closed = false;
            if (!popDiv) {
                popDiv = document.createElement("div");
                LIB.css(popDiv, {
                    position: "absolute",
                    left: "0",
                    top: "0",
                    width: "100%",
                    height: global.height + "px",
                    opacity: 0,
                    transition: "opacity 0.3s linear"
                });
                popDiv.bgDiv = document.createElement("div");
                LIB.css(popDiv.bgDiv, {
                    position: "absolute",
                    left: "0",
                    top: "0",
                    width: "100%",
                    height: "100%",
                    background: "rgba(0, 0, 0, 0.5)"
                });
                popDiv.appendChild(popDiv.bgDiv);
            }
            //to really fill the whole window. "100%" might only fill about 90% on iPhones
            function updateHeight() {
                if (closed) {
                    return;
                }
                LIB.css(popDiv, {
                    height: global.height + "px"
                });
                setTimeout(updateHeight, 100);
            }
            updateHeight();
            popDiv.appendChild(p.div);
            LIB.css(p.div, {
                width: (7 * UI.theme.halfBoxSize * 2) + "px",
                marginLeft: "auto",
                marginRight: "auto",
                position: "relative"
            });
            popDiv.ontouchmove = function () {
                return false;
            };
            p.target.appendChild(popDiv);
            setTimeout(function () {
                LIB.css(popDiv, {
                    opacity: 1
                });
            }, 20);
            close = function () {
                if (closed) {
                    return;
                }
                closed = true;
                LIB.css(popDiv, {
                    opacity: 0
                });
                setTimeout(function () {
                    p.target.removeChild(popDiv);
                    popDiv.removeChild(p.div);
                    if (p.callback) {
                        p.callback();
                    }
                }, 300);
            };
            popDiv.bgDiv.onclick = function () {
                close();
                return false;
            };
            p.setCallback(close);
        };
    }());

	/*UI.createDiv(p)
	Create a div or image with a specified style and content. Can save you a few lines.
	Returns the created element.
	p = {
		type: <string>				(Optional) Can be "image" or undefined -> creates image or div
		src: <string>				If it's an image this is the src attribute
		innerHTML: <string>			innerHTML attribute of the div
		...style...					You can add as many style attributes as you want (acts like LIB.css)
	}
	enable(<boolean>)		Enable/disable slider
	getDiv()				Returns the div element
	*/
    UI.createDiv = function (p) {
        var div;
        if (!p.type) {
            div = document.createElement("div");
        } else if (p.type === "image") {
            div = new Image();
            div.src = p.src;
            delete p.type;
            delete p.src;
        } else {
			div = document.createElement("div");
            delete p.type;
        }
        if (p.innerHTML) {
            div.innerHTML = p.innerHTML;
            delete p.innerHTML;
        }
        LIB.css(div, p);
        return div;
    };
	/*UI.showInfoPage(parent, callback)
	Shows a popup with the help and about page.
	parent		The element it will be appended to
	callback	On closing the popup
	*/
    UI.showInfoPage = function (parent, callback) {
        var aboutPage, helpPage, feedbackPage, boxSize, aboutCloseFunc, backButton, tabBar, content,
			closed, boxPx, div, activeTab, tabs;
        boxSize = UI.theme.halfBoxSize * 2;
        global.forceFS = false;
        closed = false;
        boxPx = boxSize / 44;
		div = document.createElement("div");

        helpPage = (function () {
			var div, content, page, pages, pageDots, dotContainer, i, nextButton, previousButton, pageElements;
            div = document.createElement("div");
            content = document.createElement("div");
            page = 0;
            pages = [];
            pageDots = [];
            dotContainer = document.createElement("div");
			function updatePages() {
				var i;
                for (i = 0; i < pages.length; i += 1) {
                    if (i === page) {
                        pages[i].style.display = "block";
                        LIB.css(pageDots[i], {
                            background: "rgba(255,255,255, 0.8)",
                            cursor: "default"
                        });
                    } else {
                        pages[i].style.display = "none";
                        LIB.css(pageDots[i], {
                            background: "rgba(255, 255, 255, 0.1)",
                            cursor: "pointer"
                        });
                    }
                }
                nextButton.enable(page < pages.length - 1);
                previousButton.enable(page > 0);
            }
            dotContainer.onclick = function (event) {
                var offset, x;
				offset = LIB.getGlobalOff(dotContainer);
                x = event.pageX - offset.x;
                page = parseInt(x / boxSize, 10);
                updatePages();
                return false;
            };
            dotContainer.ontouchstart = function (event) {
                var offset, x;
				if (event.touches.length > 1) {
                    return;
                }
                offset = LIB.getGlobalOff(dotContainer);
                x = event.touches[0].pageX - offset.x;
                page = parseInt(x / boxSize, 10);
                updatePages();
                return false;
            };
            LIB.css(dotContainer, {
                position: "absolute",
                left: (boxSize * 1.5) + "px",
                top: (boxSize * 4) + "px",
                width: (4 * boxSize) + "px",
                height: boxSize + "px"
            });
            //page1
            pageElements = [
                [],
                [],
                [],
                []
            ];
            pageElements[0].push(UI.createDiv({
                innerHTML: "Webchemy is for making sketches",
                fontSize: (boxSize / 2.8) + "px",
                width: "100%",
                textAlign: "center",
                paddingTop: (boxSize / 8) + "px",
                color: "#bbb",
                fontFamily: "Lucida Sans Unicode, Lucida Grande, sans-serif"
            }));
            pageElements[0].push(UI.createDiv({
                innerHTML: "Tool Bar<br/>Canvas",
                lineHeight: (boxSize * 1.4) + "px",
                position: "absolute",
                left: (boxSize * 5) + "px",
                top: (boxSize * 0.4) + "px",
                fontSize: (boxSize * 0.4) + "px",
                color: "#fff"
            }));
            pageElements[0].push(UI.createDiv({
                width: (3.5 * boxSize) + "px",
                height: (2.6 * boxSize) + "px",
                backgroundColor: "#fff",
                boxShadow: (boxSize / 11) + "px " + (boxSize / 11) + "px " + (boxSize / 3) + "px rgba(0,0,0,0.5)",
                position: "absolute",
                left: (boxSize * 0.6) + "px",
                top: (boxSize * 0.9) + "px"
            }));
            pageElements[0].push(UI.createDiv({
                width: (2.5 * boxSize) + "px",
                height: (0.45 * boxSize) + "px",
                backgroundColor: "#555",
                position: "absolute",
                left: (boxSize * 1.1) + "px",
                top: (boxSize * 0.9) + "px",
                borderBottomLeftRadius: (boxSize / 6) + "px",
                borderBottomRightRadius: (boxSize / 6) + "px"
            }));
            pageElements[0].push(UI.createDiv({
                type: "image",
                src: "help01.png",
                width: (boxPx * 135) + "px",
                height: (boxPx * 90) + "px",
                position: "absolute",
                left: (boxSize * 0.6) + "px",
                top: (boxSize * 0.9) + "px"
            }));
            pageElements[0].push(UI.createDiv({
                width: (1.4 * boxSize) + "px",
                height: boxPx + "px",
                backgroundColor: "#fff",
                borderBottom: boxPx + "px solid #000",
                position: "absolute",
                left: (boxSize * 3.5) + "px",
                top: (boxSize * 1.1) + "px"
            }));
            pageElements[0].push(UI.createDiv({
                width: (1.4 * boxSize) + "px",
                height: boxPx + "px",
                backgroundColor: "#fff",
                borderBottom: boxPx + "px solid #000",
                position: "absolute",
                left: (boxSize * 3.5) + "px",
                top: (boxSize * 2.5) + "px"
            }));
            //page 2
            pageElements[1].push(UI.createDiv({
                innerHTML: "The Tool Bar",
                fontSize: (boxSize / 2.8) + "px",
                width: "100%",
                textAlign: "center",
                paddingTop: (boxSize / 8) + "px",
                color: "#bbb",
                fontFamily: "Lucida Sans Unicode, Lucida Grande, sans-serif"
            }));
            pageElements[1].push(UI.createDiv({
                position: "absolute",
                backgroundColor: "#bbb",
                width: (boxSize / 22) + "px",
                height: (boxPx * 20) + "px",
                left: (boxPx * 91) + "px",
                top: (boxPx * 68) + "px"
            }));
            pageElements[1].push(UI.createDiv({
                position: "absolute",
                backgroundColor: "#bbb",
                width: (boxSize / 22) + "px",
                height: (boxPx * 20) + "px",
                left: (boxPx * 142) + "px",
                top: (boxPx * 68) + "px"
            }));
            pageElements[1].push(UI.createDiv({
                position: "absolute",
                backgroundColor: "#bbb",
                width: (boxSize / 22) + "px",
                height: (boxPx * 55) + "px",
                left: (boxPx * 177) + "px",
                top: (boxPx * 68) + "px"
            }));
            pageElements[1].push(UI.createDiv({
                position: "absolute",
                backgroundColor: "#bbb",
                width: (boxSize / 22) + "px",
                height: (boxPx * 30) + "px",
                left: (boxPx * 202) + "px",
                top: (boxPx * 68) + "px",
                transformOrigin: "0 0",
                transform: "rotate(-45deg)"
            }));
            pageElements[1].push(UI.createDiv({
                width: (3.7 * boxSize) + "px",
                height: (0.65 * boxSize) + "px",
                backgroundColor: "#555",
                backgroundImage: "url(help02.png)",
                backgroundRepeat: "no-repeat",
                backgroundSize: (boxPx * 161) + "px " + (boxPx * 24) + "px",
                position: "absolute",
                left: (boxSize * 1.65) + "px",
                top: (boxSize * 0.9) + "px",
                borderBottomLeftRadius: (boxSize / 6) + "px",
                borderBottomRightRadius: (boxSize / 6) + "px"
            }));
            pageElements[1].push(UI.createDiv({
                innerHTML: "Color",
                position: "absolute",
                color: "#fff",
                left: (boxPx * 60) + "px",
                top: (boxPx * 95) + "px",
                fontSize: (boxPx * 18) + "px"
            }));
            pageElements[1].push(UI.createDiv({
                innerHTML: "Brush",
                position: "absolute",
                color: "#fff",
                left: (boxPx * 120) + "px",
                top: (boxPx * 95) + "px",
                fontSize: (boxPx * 18) + "px"
            }));
            pageElements[1].push(UI.createDiv({
                innerHTML: "More Tools",
                position: "absolute",
                color: "#fff",
                left: (boxPx * 130) + "px",
                top: (boxPx * 130) + "px",
                fontSize: (boxPx * 18) + "px"
            }));
            pageElements[1].push(UI.createDiv({
                innerHTML: "Undo, Zoom, Hand Tool",
                position: "absolute",
                color: "#aaa",
                left: (boxPx * 110) + "px",
                top: (boxPx * 150) + "px",
                fontSize: (boxPx * 12) + "px"
            }));
            pageElements[1].push(UI.createDiv({
                innerHTML: "Save / Clear",
                position: "absolute",
                color: "#fff",
                left: (boxPx * 190) + "px",
                top: (boxPx * 95) + "px",
                fontSize: (boxPx * 18) + "px"
            }));

            pageElements[2].push(UI.createDiv({
                innerHTML: "Gestures & Shortcuts",
                fontSize: (boxSize / 2.8) + "px",
                width: "100%",
                textAlign: "center",
                paddingTop: (boxSize / 8) + "px",
                color: "#bbb",
                fontFamily: "Lucida Sans Unicode, Lucida Grande, sans-serif"
            }));
            pageElements[2].push(UI.createDiv({
                innerHTML: "Hide / Show Bar<br/>Reset View<br/>Panning / Zoom<br/><br/>Pick Color<br/>Undo",
                fontSize: (boxPx * 15) + "px",
                lineHeight: (boxPx * 23) + "px",
                position: "absolute",
                left: (boxPx * 30) + "px",
                top: (boxPx * 32) + "px",
                color: "#eee"
            }));
            pageElements[2].push(UI.createDiv({
                innerHTML: "<b>single</b> tap / click<br/><b>double</b> tap / click<br /><b>two fingers</b> (pinch),<br/><br/>alt + mouse<br/>ctrl + z",
                fontSize: (boxPx * 12) + "px",
                lineHeight: (boxPx * 23) + "px",
                position: "absolute",
                left: (boxPx * 170) + "px",
                top: (boxPx * 32) + "px",
                color: "#eee"
            }));
            pageElements[2].push(UI.createDiv({
                innerHTML: "middle mouse, scroll,<br/>spacebar + mouse",
                fontSize: (boxPx * 11) + "px",
                lineHeight: (boxPx * 12) + "px",
                position: "absolute",
                left: (boxPx * 170) + "px",
                top: (boxPx * 98) + "px",
                color: "#bbb"
            }));
            pageElements[2].push(UI.createDiv({
                position: "absolute",
                background: "rgba(255,255,255, 0.2)",
                width: (boxSize * 6) + "px",
                height: boxPx + "px",
                left: (boxPx * 20) + "px",
                top: (boxPx * 54) + "px",
                color: "#eee"
            }));
            pageElements[2].push(UI.createDiv({
                position: "absolute",
                background: "rgba(255,255,255, 0.2)",
                width: (boxSize * 6) + "px",
                height: boxPx + "px",
                left: (boxPx * 20) + "px",
                top: (boxPx * 77) + "px",
                color: "#eee"
            }));
            pageElements[2].push(UI.createDiv({
                position: "absolute",
                background: "rgba(255,255,255, 0.2)",
                width: (boxSize * 6) + "px",
                height: boxPx + "px",
                left: (boxPx * 20) + "px",
                top: (boxPx * 124) + "px",
                color: "#eee"
            }));
            pageElements[2].push(UI.createDiv({
                position: "absolute",
                background: "rgba(255,255,255, 0.2)",
                width: (boxSize * 6) + "px",
                height: boxPx + "px",
                left: (boxPx * 20) + "px",
                top: (boxPx * 146) + "px",
                color: "#eee"
            }));
            pageElements[3].push(UI.createDiv({
                innerHTML: 'More Resources<br/><br/><a href="http://webchemy.org/help/" target="_blank">Help Discussion Board</a><br/><br/><a href="http://youtube.com/bitbof" target="_blank">Youtube Videos about Webchemy</a>',
                paddingTop: boxSize + "px",
                textAlign: "center",
                width: "100%"
            }));
			function createPage(i) {
				var e;
				pages[i] = document.createElement("div");
				for (e = 0; e < pageElements[i].length; e += 1) {
					pages[i].appendChild(pageElements[i][e]);
				}
				pages[i].style.display = "none";
				pages[i].style.cursor = "default";
				pages[i].ontouchstart = function () {
					return false;
				};
				content.appendChild(pages[i]);
				pageDots[i] = document.createElement("div");
				LIB.css(pageDots[i], {
					position: "absolute",
					top: (boxSize / 2) + "px",
					left: (boxSize * i + boxSize / 2) + "px",
					width: (boxSize / 3) + "px",
					height: (boxSize / 3) + "px",
					marginLeft: -(boxSize / 6) + "px",
					marginTop: -(boxSize / 6) + "px",
					borderRadius: (boxSize / 6) + "px",
					background: "rgba(255, 255, 255, 0.1)",
					cursor: "pointer"
				});
				if (i === 0) {
					pages[i].style.display = "block";
					LIB.css(pageDots[i], {
						background: "rgba(255,255,255, 0.8)",
						cursor: "default"
					});
				}
				dotContainer.appendChild(pageDots[i]);
			}
            for (i = 0; i < 4; i += 1) {
                createPage(i);
            }

            nextButton = new UI.Button({
                im: "btn_next.svg",
                animated: true,
                touchGlow: true,
                callback: function () {
                    page += 1;
                    updatePages();
                }
            });
            LIB.css(nextButton.getDiv(), {
                position: "absolute",
                left: (boxSize * 6) + "px",
                top: (boxSize * 4) + "px"
            });
            previousButton = new UI.Button({
                im: "btn_previous.svg",
                animated: true,
                touchGlow: true,
                disabled: true,
                callback: function () {
                    page -= 1;
                    updatePages();
                }
            });
            LIB.css(previousButton.getDiv(), {
                position: "absolute",
                left: 0,
                top: (boxSize * 4) + "px"
            });
            div.appendChild(content);
            div.appendChild(previousButton.getDiv());
            div.appendChild(dotContainer);
            div.appendChild(nextButton.getDiv());
            LIB.css(div, {
                fontSize: (boxSize / 3.0) + "px",
                lineHeight: (boxSize / 2.5) + "px",
                color: UI.theme.labelColor
            });
            return div;
        }());
        feedbackPage = (function () {
			var div;
            div = document.createElement("div");
            return div;
        }());
        aboutPage = (function () {
            var div = document.createElement("div");
            div.innerHTML = 'Webchemy is an attempt to recreate parts of Alchemy on the web, with support for mobile platforms like the iPad.<br/>Webchemy is licensed under GNU General Public License version 3.<br/>by <a href="http://bitbof.com" target="_blank">bitbof</a> 2012' + '<br /><br/><b><a href="about" target="_blank">Learn more about Webchemy</a></b><br/><br/>' + '<a href="https://github.com/bitbof/webchemy" target="_blank">Webchemy Source Code (github)</a><br/><br/>' + '<a href="http://al.chemy.org/" target="_blank">Alchemy Homepage</a>';
            LIB.css(div, {
                fontSize: (boxSize / 3.0) + "px",
                color: UI.theme.labelColor,
                display: "none",
                textAlign: "justify",
                lineHeight: "17px"
            });
            return div;
        }());
        div.className = "WebchemyAppShadedPopupBG";
        backButton = document.createElement("div");
        tabBar = document.createElement("div");
        content = document.createElement("div");
        aboutCloseFunc = function () {};

        LIB.css(div, {
            width: (7 * boxSize) + "px",
            height: (7 * boxSize) + "px",
            backgroundColor: UI.theme.expandCol,
            borderBottomRightRadius: (UI.theme.halfBoxSize / 3) + "px",
            borderBottomLeftRadius: (UI.theme.halfBoxSize / 3) + "px"
        });
        backButton.innerHTML = "back";

        activeTab = 0;
        tabs = [{
            div: helpPage,
            label: "Help"
        }, {
            div: aboutPage,
            label: "About"
        }, {
            div: feedbackPage,
            label: "Feedback"
        }];

        function tabClick(p) {
            var i;
            activeTab = p;
            for (i = 0; i < tabs.length; i += 1) {
                if (i !== activeTab) {
                    LIB.css(tabs[i].button, {
                        borderBottom: (boxSize / 22) + "px solid rgba(0,0,0,0)",
                        cursor: "pointer"
                    });
                    tabs[i].div.style.display = "none";
                } else {
                    LIB.css(tabs[i].button, {
                        borderBottom: (boxSize / 22) + "px solid #fff",
                        cursor: "default"
                    });
                    tabs[i].div.style.display = "block";
                }
            }
        }

        function createTabButton(p) {
            tabs[p].button = document.createElement("div");
            tabs[p].button.innerHTML = tabs[p].label;
            LIB.css(tabs[p].button, {
                padding: (boxSize / 8) + "px",
                paddingTop: (boxSize / 3) + "px",
                boxSizing: "border-box",
                width: "33%",
                borderBottom: (boxSize / 22) + "px solid #fff",
                cursor: "default",
                cssFloat: "left"
            });
            if (activeTab !== p) {
                LIB.css(tabs[p].button, {
                    borderBottom: (boxSize / 22) + "px solid rgba(0, 0, 0, 0)",
                    cursor: "pointer"
                });
            }
            LIB.setClickListener({
                el: tabs[p].button,
                glowPos: {
                    x: boxSize,
                    y: boxSize / 2
                },
                callback: function () {
                    if (activeTab === p) {
                        return false;
                    }
                    tabClick(p);
                }
            });
            tabBar.appendChild(tabs[p].button);
        }
        createTabButton(0);
        createTabButton(1);
        createTabButton(2);
        LIB.css(backButton, {
            height: boxSize + "px",
            width: (boxSize * 7) + "px",
            backgroundColor: UI.theme.barCol,
            textAlign: "center",
            fontSize: (boxSize / 3.0) + "px",
            lineHeight: boxSize + "px",
            cursor: "pointer",
            fontWeight: "bold"
        });
        LIB.setClickListener({
            el: backButton,
            callback: function () {
                if (closed) {
                    return;
                }
                aboutCloseFunc();
            }
        });
        LIB.css(tabBar, {
            fontSize: (boxSize / 3.0) + "px",
            paddingLeft: (boxSize / 3.0) + "px",
            paddingRight: (boxSize / 3.0) + "px",
            width: "100%",
            boxSizing: "border-box",
            height: boxSize + "px",
            color: "#fff",
            textAlign: "center"
        });
        LIB.css(content, {
            fontSize: (boxSize / 3.0) + "px",
            paddingLeft: (boxSize / 3.5) + "px",
            paddingRight: (boxSize / 3.5) + "px",
            color: UI.theme.labelColor,
            clear: "both",
            position: "relative"
        });
        backButton.className = "WebchemyAppShadedBar";
        div.appendChild(backButton);
        div.appendChild(tabBar);
        div.appendChild(content);
        content.appendChild(helpPage);
        content.appendChild(feedbackPage);
        content.appendChild(aboutPage);
        UI.showPopup({
            target: parent,
            div: div,
            callback: function () {
                closed = true;
                global.forceFS = true;
                callback();
            },
            setCallback: function (f) {
                aboutCloseFunc = f;
            }
        });
    };

    /*UI.showExportPage(parent, image)
	Shows a popup with that let's users save their drawing via the browsers context menu.
	parent		The element it will be appended to
	image		Image that needs saving
	*/
    UI.showExportPage = function (parent, image) {
        var boxSize, aboutCloseFunc, backButton, aboutDiv, closed, aniToggle, imageContainer, coverImage, coverSize,
			text, holding, aniTimeout;
        global.forceFS = false;
        boxSize = UI.theme.halfBoxSize * 2;
        aboutCloseFunc = function () {};
        closed = false;
        aniToggle = false;
        backButton = document.createElement("div");
        aboutDiv = document.createElement("div");
        LIB.css(aboutDiv, {
            width: (7 * boxSize) + "px",
            backgroundColor: UI.theme.expandCol,
            borderBottomRightRadius: (UI.theme.halfBoxSize / 3) + "px",
            borderBottomLeftRadius: (UI.theme.halfBoxSize / 3) + "px"
        });
        backButton.innerHTML = "back";

        LIB.setClickListener({
            el: backButton,
            callback: function () {
                if (closed) {
                    return;
                }
                aboutCloseFunc();
            }
        });
        LIB.css(backButton, {
            height: boxSize + "px",
            width: (boxSize * 7) + "px",
            backgroundColor: UI.theme.barCol,
            textAlign: "center",
            fontSize: (boxSize / 3.0) + "px",
            lineHeight: boxSize + "px",
            cursor: "pointer",
            fontWeight: "bold"
        });

        imageContainer = document.createElement("div");
        coverImage = new Image();
        coverImage.src = image.src;

        imageContainer.appendChild(coverImage);
        imageContainer.appendChild(image);

        LIB.css(imageContainer, {
            width: (6 * boxSize) + "px",
            height: (4 * boxSize) + "px",
            marginTop: (boxSize / 2 - 1) + "px",
            marginLeft: (boxSize / 2 - 1) + "px",
            position: "relative",
            overflow: "hidden",
            boxShadow: "0 0 10px 4px rgba(255,255,255, 0)",
            border: "1px solid rgba(255, 255, 255, 1)",
            transition: "box-shadow 0.7s linear"
        });
        LIB.css(image, {
            position: "absolute",
            left: 0,
            top: 0,
            width: (6 * boxSize) + "px",
            height: (4 * boxSize) + "px",
            opacity: 0
        });
        coverSize = {
            width: (6 * boxSize),
            height: (6 * boxSize / image.width) * image.height
        };
        if (coverSize.height < (4 * boxSize)) {
            coverSize.height = (4 * boxSize);
            coverSize.width = (coverSize.height / image.height) * image.width;
        }
        LIB.css(coverImage, {
            position: "absolute",
            top: (2 * boxSize) + "px",
            left: (3 * boxSize) + "px",
            width: coverSize.width + "px",
            height: coverSize.height + "px",
            marginLeft: (-coverSize.width / 2) + "px",
            marginTop: (-coverSize.height / 2) + "px"
        });

        function animation() {
            if (closed) {
                return;
            }
            aniToggle = !aniToggle;
            if (aniToggle) {
                LIB.css(imageContainer, {
                    border: "1px solid rgba(0, 0, 0, 1)"
                });
            } else {
                LIB.css(imageContainer, {
                    border: "1px solid rgba(255, 255, 255, 1)"
                });
            }
            setTimeout(animation, 510);
        }
        animation();

        text = document.createElement("div");
        text.innerHTML = "Right-Click or Press-Hold on the image, then save.";
        text.ontouchstart = function () {
            return false;
        };
        LIB.css(text, {
            fontSize: (boxSize / 2.5) + "px",
            color: UI.theme.labelColor,
            padding: "10px",
            textAlign: "center"
        });

        backButton.className = "WebchemyAppShadedBar";
        aboutDiv.appendChild(backButton);
        aboutDiv.appendChild(imageContainer);
        aboutDiv.appendChild(text);

        holding = false;
        image.ontouchstart = function () {
            LIB.css(imageContainer, {
                boxShadow: "0 0 10px 8px rgba(255,255,255, 1)"
            });
            holding = true;
            aniTimeout = setTimeout(function () {
                holding = false;
                LIB.css(imageContainer, {
                    boxShadow: "0 0 10px 4px rgba(255,255,255, 0)"
                });
            }, 1500);
        };
        image.ontouchmove = function () {
            LIB.css(imageContainer, {
                boxShadow: "0 0 10px 4px rgba(255,255,255, 0)"
            });
            holding = false;
            clearTimeout(aniTimeout);
        };
        image.ontouchend = function () {
            LIB.css(imageContainer, {
                boxShadow: "0 0 10px 4px rgba(255,255,255, 0)"
            });
            holding = false;
            clearTimeout(aniTimeout);
        };

        UI.showPopup({
            target: parent,
            div: aboutDiv,
            callback: function () {
                global.forceFS = true;
                closed = true;
            },
            setCallback: function (f) {
                aboutCloseFunc = f;
            }
        });
    };
    /*UI.ButtonBarCombination(p)
	Coordinates an ExpandButton and an ExpandBar. ButtonBarCombinations go into a BarContainer.
	p = {
		width: <number>				(Default 7) Width in (halfBoxSize * 2) units
		expandHeight: <number>		(Default 1) height in (halfBoxSize * 2) units
		leftOffset: <number>		(Default 0) offset in (halfBoxSize * 2) units
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
            width: p.width || 7,
            height: p.expandHeight || 1,
            leftOffset: p.leftOffset || 0
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
	/*UI.BrushPreview()
	A canvas previewing brush settings. Can expand and collapse in size. (halfBoxSize * 4 and halfBoxSize * 2)
	
	expand(<boolean>)		Expand or collapse depending on param
	update(brushState)		Updates the preview
	getDiv()				Returns the canvas
	
	brushState = {
		symmetry: "horizontal" | "vertical"		Brush symmetry
		mode: "pull" | "stroke" | "fill"		Brush mode
		gradient: <boolean>						Brush using gradient or not
		splat: <boolean>						Splat modifier
		size: <number>							Brush Size (0.0 - 1.0)
	}
	*/
    UI.BrushPreview = function () {
		var width, height, pathData, pathData2, pathData3, pathData4, canvas, brushState;
        width = UI.theme.halfBoxSize * 4;
        height = UI.theme.halfBoxSize * 4;
        pathData = {
            d: "M -41.936042,47.619745 C -53.113503,10.095445 -37.63726,-10.737795 -3.2141263,1.712345 23.995161,11.553245 55.866726,-13.457185 42.294107,-46.191174"
        };
        pathData2 = {
            d: "M 42.118953,-49.472741 L 48.008453,-34.372628 33.909333,-32.584456 42.832827,4.1724005 24.98584,-4.3710848 15.169993,25.233085 -3.033942,-2.1855418 -8.5665048,9.934286 -39.977208,-9.3382278 -29.625953,7.3513719 -47.829884,21.656742 -30.161363,26.226513 -46.223655,49.472741"
        };
        pathData3 = {
            d: "M 19.921862,-31.093434 C 11.425935,-36.559012 4.4560701,-46.078656 -6.4549733,-46.444027 -13.466007,-47.219789 -20.342393,-38.624506 -16.348469,-32.261038 -9.9770798,-27.415153 -21.782777,-24.539302 -22.099064,-19.347804 -22.355747,-15.407325 -18.817161,-12.303889 -18.657262,-8.3064167 -17.61268,-3.9385691 -20.801225,0.29790503 -25.023234,1.2827118 -30.90754,4.0144405 -36.019277,10.400293 -43.158623,8.8617894 -48.395622,6.5129021 -44.128601,0.03681353 -45.238424,-3.7931189 -49.134611,0.26500193 -49.434806,7.2004769 -48.405542,12.675947 -47.066346,18.115802 -45.277115,24.034288 -41.051169,27.94193 -37.393808,31.10386 -30.403337,31.407858 -28.200735,26.382428 -25.677447,19.86532 -25.708699,11.278318 -19.090786,7.2233169 -14.576697,5.7454856 -9.9840961,3.2928095 -8.2552994,-1.4767809 -6.1015708,-5.811949 -6.1720668,-10.796324 -4.8140148,-15.320873 -2.1770567,-19.88032 3.642171,-16.956832 6.9161095,-14.780718 12.39294,-11.46364 17.508692,-5.5083485 16.20764,1.3237977 14.987171,6.8485296 8.5683761,9.4110863 3.4269817,8.1014806 -0.48485906,7.3778123 -5.3045722,7.0931532 -7.968277,10.690126 -16.24545,18.911517 -23.448649,28.145446 -31.854942,36.242204 -34.845091,39.784791 -31.913084,44.921017 -27.591483,45.171092 -22.88718,46.205469 -19.000528,42.892733 -15.30467,40.64948 -10.676109,36.440184 -10.715707,28.398924 -4.5171342,25.743318 2.3812396,26.987126 8.1135271,34.007252 15.585616,31.566418 21.298503,29.986619 27.085321,27.990893 31.653811,24.030658 37.029217,19.654343 41.066272,13.595996 42.804926,6.8683195 48.999355,3.4457589 51.357925,-6.949582 44.98537,-11.351114 39.961286,-13.7268 32.873133,-11.890427 29.100051,-16.817082 26.901628,-20.306746 29.04063,-24.739684 26.944367,-28.340545 25.705012,-31.653445 21.971265,-32.895355 18.851234,-31.521686"
        };
        pathData4 = {
            d: "M -3.3928572,-9.1071431 C 1.8844166,-22.684329 9.1936364,-36.231724 21.2336,-44.954446 18.889152,-35.488968 8.7189094,-30.543752 6.1968079,-21.198115 4.540427,-14.127493 13.811808,-18.053971 17.904513,-16.399023 23.455825,-15.873783 31.034572,-15.577909 33.846356,-21.529381 34.97236,-27.178717 34.064519,-33.258341 36.360093,-38.646557 40.639296,-42.124064 38.798722,-33.776723 38.966474,-31.358658 38.700763,-23.545103 38.434325,-15.715787 38.903013,-7.9043399 32.18549,-10.589101 25.192172,-14.343131 17.740497,-13.365214 10.777427,-12.141435 18.490107,-5.8630115 20.207822,-2.6629816 24.448086,2.5452753 28.352576,8.0130956 31.634096,13.871162 37.75413,23.368518 43.389314,33.406784 46.172979,44.440639 40.227035,31.956693 31.8578,20.864138 23.56321,9.8762996 21.479194,6.2297593 19.486438,1.9504585 15.812957,-0.2801517 14.426089,3.4818426 17.120975,8.3035823 16.91116,12.588411 17.656821,20.294699 16.327723,29.592587 9.0185981,33.820098 3.4051168,37.675435 -3.4592808,39.156261 -10.061416,40.373571 -1.6142398,39.00424 7.5916758,35.792928 12.509583,28.31636 16.514618,21.870622 12.492442,13.681843 7.1905113,9.3595596 1.6449937,4.481116 -7.478976,3.4383431 -13.210305,8.5751687 -20.154779,13.335392 -27.819571,16.947171 -35.420274,20.520931 -30.671416,17.793559 -24.763392,16.188231 -21.490052,11.530331 -20.267852,6.6922819 -27.279828,6.8132116 -29.45833,3.7127513 -38.505789,-4.4393085 -42.045771,-16.902644 -43.183273,-28.641484 -43.008475,-34.118701 -41.270075,-40.494922 -36.284204,-43.478438 -32.187069,-45.203636 -42.834793,-38.165764 -37.002266,-37.609093 -32.514252,-37.615042 -28.346869,-41.007974 -23.839041,-38.753083 -21.66147,-37.844362 -16.347373,-36.481722 -16.698858,-34.317536 -21.89964,-34.795345 -26.81718,-38.823228 -32.125966,-36.107746 -37.208062,-34.53346 -40.488607,-28.190417 -37.305263,-23.476422 -35.36476,-19.096901 -30.585812,-15.887464 -25.748981,-17.665295 -19.915267,-19.332041 -15.346006,-23.91773 -12.73449,-29.267934 -10.388912,-32.377307 -7.2082669,-37.827343 -4.5236747,-39.047157 -6.8851377,-33.918724 -11.44606,-30.258409 -13.950533,-25.184503 -16.253969,-20.790831 -19.168687,-15.5335 -17.155062,-10.515596 -14.158456,-5.6058719 -8.0980074,-8.3345678 -3.5714286,-6.9642859"
        };
        canvas = document.createElement("canvas");
        if (global.retina) {
            canvas.width = width * 2;
            canvas.height = height * 2;
        } else {
            canvas.width = width;
            canvas.height = height;
        }

        LIB.css(canvas, {
            transformOrigin: "100% 0",
            position: "absolute",
            left: 0,
            top: 0,
            transform: "scale(0.5)",
            transition: "all 0.1s linear",
            width: width + "px",
            height: height + "px"
        });
        brushState = {};

        function draw() {
			var context, color, max, i;
            canvas.width = parseInt(canvas.width, 10);
            context = canvas.getContext("2d");
            context.setTransform(1, 0, 0, 1, 0, 0);
            if (global.retina) {
                context.scale(2, 2);
            }
            color = "rgba(255, 255, 255, 1)";
            context.save();
            context.translate(width / 11, height / 11);
            context.scale(9 / 11, 9 / 11);

            max = 1;
            if (brushState.symmetry === "horizontal") {
                max += 1;
                context.scale(0.5, 1);
            } else if (brushState.symmetry === "vertical") {
                max += 1;
                context.scale(1, 0.5);
            }
            for (i = 0; i < max; i += 1) {
                if (i === 1) {
                    if (brushState.symmetry === "horizontal") {
                        context.translate(2 * width, 0);
                        context.scale(-1, 1);
                    }
                    if (brushState.symmetry === "vertical") {
                        context.translate(0, 2 * height);
                        context.scale(1, -1);
                    }
                }
                context.save();
                if (brushState.mode === "pull") {
                    if (brushState.gradient) {
                        color = context.createLinearGradient(0, -50, 0, 50);
                        color.addColorStop(0, "rgba(255, 255, 255, 1)");
                        color.addColorStop(1, "rgba(255, 255, 255, 0)");
                    }
                    context.fillStyle = color;
                    context.save();
                    context.translate(width / 2, height / 2);
                    context.scale(1 / 200 * width, 1 / 200 * height);
                    if (brushState.splat) {
                        LIB.drawPathOnCanvas(pathData4, context);
                    } else {
                        LIB.drawPathOnCanvas(pathData3, context);
                    }
                    context.fill();
                    context.restore();

                    context.save();
                    context.translate(0.2 * width, 0.8 * height);
                    context.scale(1 / 200 * width, 1 / 200 * height);
                    context.rotate(786);
                    if (brushState.splat) {
                        LIB.drawPathOnCanvas(pathData4, context);
                    } else {
                        LIB.drawPathOnCanvas(pathData3, context);
                    }
                    context.fill();
                    context.restore();

                    context.save();
                    context.translate(0.8 * width, 0.2 * height);
                    context.scale(1 / 200 * width, 1 / 200 * height);
                    context.rotate(1786);
                    if (brushState.splat) {
                        LIB.drawPathOnCanvas(pathData4, context);
                    } else {
                        LIB.drawPathOnCanvas(pathData3, context);
                    }
                    context.fill();
                    context.restore();
                } else {

                    if (brushState.gradient) {
                        color = context.createLinearGradient(0, -50, 0, 50);
                        color.addColorStop(0, "rgba(255, 255, 255, 1)");
                        color.addColorStop(1, "rgba(255, 255, 255, 0)");
                    }
                    context.lineWidth = 1 + brushState.size * brushState.size;
                    context.lineJoin = "round";
                    context.lineCap = "round";
                    context.strokeStyle = color;
                    context.fillStyle = color;
                    context.translate(width / 2, height / 2);
                    context.scale(1 / 100 * width, 1 / 100 * height);

                    if (brushState.splat) {
                        LIB.drawPathOnCanvas(pathData2, context);
                    } else {
                        LIB.drawPathOnCanvas(pathData, context);
                    }
                    if (brushState.mode === "stroke") {
                        context.stroke();
                    } else {
                        context.fill();
                    }
                }
                context.restore();
            }

            context.restore();
        }
        this.expand = function (p) {
            if (p) {
                LIB.css(canvas, {
                    transform: "scale(1)"
                });
                canvas.title = "Brush Preview";
            } else {
                LIB.css(canvas, {
                    transform: "scale(0.5)"
                });
                canvas.title = "";
            }
        };
        this.update = function (p) {
            brushState = p;
            draw();
        };
        this.getDiv = function () {
            return canvas;
        };
    };
	/*UI.BrushButtonBarCombination(p)
	Like a ButtonBarCombination but with a brush preview and a width of 4 * halfBoxSize
	p = {
		callback: <function(cbVal)>		Callback on expanding/collapsing
	}
	cbVal = {
		expand:	<boolean>		True on expand
		collapse: <boolean>		True on collapse
	}
	collapse()						Collapses combination. Also causes a callback.
	addListener(<function(evt)>)	Adds a callback listener
	updateBrushPreview(brushState)	Update the brush preview and opacity label
	getBar()						Returns the ExpandBar object (not div)
	getButton()						Returns the ExpandButton object (not div)
	
	brushState = {
		opacity: <number>						Brush opacity (0.0 - 1.0)
		symmetry: "horizontal" | "vertical"		Brush symmetry
		mode: "pull" | "stroke" | "fill"		Brush mode
		gradient: <boolean>						Brush using gradient or not
		splat: <boolean>						Splat modifier
		size: <number>							Brush Size (0.0 - 1.0)
	}
	*/
    UI.BrushButtonBarCombination = function (p) {
        var bar, listeners, buttonContainer, boxSize, opacity, preview, opacityDiv, overlayTimeout, opacityOverlay, shadowBox;
        boxSize = UI.theme.halfBoxSize * 2;
        opacity = 1;
        listeners = [];
        if (p && p.callback !== undefined) {
            listeners.push(p.callback);
        }

        function callback(p) {
            var i;
            for (i = 0; i < listeners.length; i += 1) {
                listeners[i](p);
            }
        }

        function updateOpacityDiv() {
            opacityDiv.innerHTML = '<span style="font-size: ' + parseInt(UI.theme.halfBoxSize / 1.8, 10) + 'px; opacity: 0.8">opacity</span><br/>' + parseInt(100 * Math.max(0.05, Math.min(1, opacity)), 10) + '%';
        }
        bar = new UI.ExpandBar({
            width: 7,
            height: 2
        });
        buttonContainer = new UI.ExpandButton({
            text: " ",
            callback: function (val) {
                if (val.expanded) {
                    bar.expand();
                    preview.expand(true);
                    opacityDiv.style.display = "none";
                    LIB.css(opacityOverlay, {
                        top: (UI.theme.halfBoxSize * 1.5) + "px"
                    });
                    callback({
                        expand: true
                    });
                } else if (val.expanded === false) {
                    bar.collapse();
                    preview.expand(false);
                    updateOpacityDiv();
                    opacityDiv.style.display = "block";
                    preview.getDiv().style.opacity = 1;
                    LIB.css(opacityOverlay, {
                        top: (-2 * boxSize) + "px"
                    });
                    callback({
                        collapse: true
                    });
                }
            }
        });
        LIB.css(buttonContainer.getDiv(), {
            position: "relative",
            width: (boxSize * 2) + "px"
        });

        preview = new UI.BrushPreview();
        opacityDiv = document.createElement("div");
        updateOpacityDiv();
        LIB.css(opacityDiv, {
            position: "absolute",
            left: 0,
            top: 0,
            width: boxSize + "px",
            height: boxSize + "px",
            textAlign: "center",
            fontSize: (UI.theme.halfBoxSize / 1.4) + "px"
        });
        opacityOverlay = document.createElement("div");
        LIB.css(opacityOverlay, {
            position: "absolute",
            left: 0,
            top: (-2 * boxSize) + "px",
            width: (boxSize * 2) + "px",
            textAlign: "center",
            opacity: 0,
            transition: "opacity 0.1s linear",
            textShadow: "1px 2px 1px rgba(0,0,0,1)",
            fontWeight: "bold"
        });
        opacityOverlay.innerHTML = "100%";
        buttonContainer.getDiv().appendChild(preview.getDiv());
        buttonContainer.getDiv().appendChild(opacityDiv);
        buttonContainer.getDiv().appendChild(opacityOverlay);

        shadowBox = document.createElement("div");
        LIB.css(shadowBox, {
            position: "absolute",
            left: (boxSize * 2) + "px",
            top: boxSize + "px",
            width: (boxSize * 2) + "px",
            height: boxSize + "px",
            boxShadow: "0 3px 4px rgba(0,0,0,0.3)"
        });
        bar.getContentDiv().appendChild(shadowBox);

        //interface
        this.collapse = function () {
            buttonContainer.collapse();
            bar.collapse();
            preview.expand(false);
            updateOpacityDiv();
            opacityDiv.style.display = "block";
            clearTimeout(overlayTimeout);
            opacityOverlay.style.opacity = 0;
            preview.getDiv().style.opacity = 1;
            LIB.css(opacityOverlay, {
                top: (-2 * boxSize) + "px"
            });
            callback({
                collapse: true
            });
        };
        this.addListener = function (p) {
            listeners.push(p);
        };
        this.updateBrushPreview = function (p) {
            if (opacity !== p.opacity) {
                opacity = p.opacity;
                opacityOverlay.innerHTML = parseInt(100 * Math.max(0.05, Math.min(1, opacity)), 10) + "%";
                opacityOverlay.style.opacity = 1;
                preview.getDiv().style.opacity = 0.4;
                clearTimeout(overlayTimeout);
                overlayTimeout = setTimeout(function () {
                    opacityOverlay.style.opacity = 0;
                    preview.getDiv().style.opacity = 1;
                }, 500);
            } else {
                preview.update(p);
            }
        };
        this.getBar = function () {
            return bar;
        };
        this.getButton = function () {
            return buttonContainer;
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
        //create hue gradient
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
                color.h = (1 - val.y) * 359;
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
            marginLeft: "-6px",
            marginTop: "-6px"
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
	/*UI.ColorSwatch(callback)
	Offers a few color palettes that can be customized.
	callback({r, g, b})		when a new color was selected
	
	setColor({r, g, b})		Set the currently selected color ... also needs to be done after callback
	getDiv()				Get the div of the element
     */
    UI.ColorSwatch = function (callback) {
        var div, size, boxSize, pxSize, pageTransitioning, colorLibrary, colorSetIndex, values, gridArea, pageContainer,
			currentSwatchSet, swatchSets, i, selectedColor, currentColBox, dragMeLabel, dragging, drawPos, target,
			lastTime, aniFac, inputPos, dragBox, previousButton, nextButton, pageLabel;
        size = 0.75;
        boxSize = UI.theme.halfBoxSize * 2;
        pxSize = UI.theme.halfBoxSize / 22;
        pageTransitioning = false;
        div = document.createElement("div");
        LIB.css(div, {
            position: "relative"
        });

        colorLibrary = [
            [{
                r: 75,
				g: 82,
				b: 22
            }, {
                r: 24,
				g: 36,
				b: 20
            }, {
                r: 243,
                g: 244,
                b: 243
            }, {
                r: 178,
                g: 146,
                b: 54
            }, {
                r: 234,
                g: 134,
                b: 12
            }, {
                r: 197,
                g: 75,
                b: 20
            }, {
                r: 150,
                g: 30,
                b: 14
            }, {
                r: 79,
                g: 145,
                b: 176
            }],
            [{
                r: 66,
                g: 95,
                b: 67
            }, {
                r: 113,
                g: 85,
                b: 63
            }, {
                r: 35,
                g: 68,
                b: 147
            }, {
                r: 227,
                g: 215,
                b: 199
            }, {
                r: 210,
                g: 166,
                b: 119
            }, {
                r: 236,
                g: 89,
                b: 71
            }, {
                r: 127,
                g: 54,
                b: 39
            }, {
                r: 15,
                g: 27,
                b: 27
            }],
            [{
                r: 29,
                g: 42,
                b: 74
            }, {
                r: 69,
                g: 74,
                b: 138
            }, {
                r: 140,
                g: 152,
                b: 193
            }, {
                r: 244,
                g: 249,
                b: 255
            }, {
                r: 57,
                g: 231,
                b: 255
            }, {
                r: 47,
                g: 119,
                b: 195
            }, {
                r: 54,
                g: 75,
                b: 78
            }, {
                r: 111,
                g: 143,
                b: 43
            }],
            [{
                r: 181,
                g: 153,
                b: 211
            }, {
                r: 227,
                g: 154,
                b: 139
            }, {
                r: 150,
                g: 216,
                b: 228
            }, {
                r: 223,
                g: 140,
                b: 77
            }, {
                r: 251,
                g: 252,
                b: 238
            }, {
                r: 76,
                g: 72,
                b: 115
            }, {
                r: 111,
                g: 80,
                b: 84
            }, {
                r: 198,
                g: 188,
                b: 97
            }]
        ];
        colorSetIndex = 0;
        values = colorLibrary[colorSetIndex];

        function createButton(x, y) {
            var div = document.createElement("div");
            LIB.css(div, {
                position: "absolute",
                left: (x * boxSize) + "px",
                top: (y * boxSize) + "px",
                width: (size * boxSize) + "px",
                height: (size * boxSize) + "px",
                marginLeft: ((1 - size) * UI.theme.halfBoxSize - pxSize) + "px",
                marginTop: ((1 - size) * UI.theme.halfBoxSize - pxSize) + "px",
                border: pxSize + "px solid rgba(255, 255, 255, 0.5)",
                backgroundColor: "rgb(0, 0, 0)"
            });
            div.setColor = function (p) {
                LIB.css(div, {
                    backgroundColor: "rgb(" + p.r + ", " + p.g + ", " + p.b + ")"
                });
            };
            return div;
        }

        gridArea = document.createElement("div");
        LIB.css(gridArea, {
            position: "absolute",
            overflow: "hidden",
            width: (4 * boxSize) + "px",
            height: (2 * boxSize) + "px",
            top: boxSize + "px",
            left: 0,
            cursor: "pointer"
        });

        function gridClick(i) {
            if (i < 0 || i > 7) {
                return;
            }
            callback({
                r: values[i].r,
                g: values[i].g,
                b: values[i].b
            });
        }
        gridArea.onmousedown = function (event) {
            var off, x, y;
            off = LIB.getGlobalOff(gridArea);
            x = parseInt((event.pageX - off.x) / boxSize, 10);
            y = parseInt((event.pageY - off.y) / boxSize, 10);
            gridClick(x + 4 * y);
        };
        gridArea.ontouchstart = function (event) {
            var off, x, y;
            if (event.touches.length !== 1) {
                return false;
            }
            off = LIB.getGlobalOff(gridArea);
            x = parseInt((event.touches[0].pageX - off.x) / boxSize, 10);
            y = parseInt((event.touches[0].pageY - off.y) / boxSize, 10);
            UI.spawnGlow(off.x + boxSize * x + UI.theme.halfBoxSize, off.y + boxSize * y + UI.theme.halfBoxSize);
            gridClick(x + 4 * y);
            return false;
        };

        //PAGE Container
        pageContainer = [];
        pageContainer[0] = document.createElement("div");
        LIB.css(pageContainer[0], {
            position: "absolute",
            width: (4 * boxSize) + "px",
            height: (2 * boxSize) + "px",
            transition: "all 0.2s ease-out",
            left: (-4 * boxSize) + "px",
            top: 0
        });
        pageContainer[1] = document.createElement("div");
        LIB.css(pageContainer[1], {
            position: "absolute",
            width: (4 * boxSize) + "px",
            height: (2 * boxSize) + "px",
            transition: "all 0.2s ease-out",
            left: 0,
            top: 0
        });
        pageContainer[2] = document.createElement("div");
        LIB.css(pageContainer[2], {
            position: "absolute",
            width: (4 * boxSize) + "px",
            height: (2 * boxSize) + "px",
            transition: "all 0.2s ease-out",
            left: (4 * boxSize) + "px",
            top: 0
        });
        gridArea.appendChild(pageContainer[0]);
        gridArea.appendChild(pageContainer[1]);
        gridArea.appendChild(pageContainer[2]);
        //color boxes that get put into the pageContainers
        currentSwatchSet = 0;
        swatchSets = [
            [],
            []
        ];
        for (i = 0; i < 8; i += 1) {
            swatchSets[0][i] = createButton(i % 4, parseInt(i / 4, 10));
            swatchSets[1][i] = createButton(i % 4, parseInt(i / 4, 10));
            swatchSets[currentSwatchSet][i].setColor(values[i]);
            pageContainer[1].appendChild(swatchSets[currentSwatchSet][i]);
        }

        selectedColor = {
            r: 0,
            g: 0,
            b: 0
        };
        currentColBox = document.createElement("div");
        LIB.css(currentColBox, {
            position: "absolute",
            width: (boxSize + size * boxSize) + "px",
            height: (size * boxSize) + "px",
            left: ((1 - size) * UI.theme.halfBoxSize - pxSize * 2) + "px",
            top: ((1 - size) * UI.theme.halfBoxSize - pxSize * 2) + "px",
            backgroundColor: "rgb(" + selectedColor.r + ", " + selectedColor.g + ", " + selectedColor.b + ")",
            cursor: "move",
            border: (pxSize * 2) + "px solid rgba(255, 255, 255, 1)",
            borderRadius: (size * UI.theme.halfBoxSize + pxSize * 2) + "px",
            boxShadow: "0 2px 4px rgba(0, 0, 0, 1) inset"
        });
        dragMeLabel = document.createElement("div");
        dragMeLabel.innerHTML = "drag me";
        LIB.css(dragMeLabel, {
            opacity: 0.5,
            width: "100%",
            textAlign: "center",
            marginTop: (boxSize / 7) + "px",
            fontSize: (boxSize / 2.8) + "px"
        });
        currentColBox.appendChild(dragMeLabel);
        dragging = false;
        drawPos = {};
		inputPos = {};
        target = -1;

        function animate() {
			var delta, dist;
            if (!dragging) {
                return;
            }
            delta = new Date().getTime() - lastTime;
            while (delta > 16) {
                if (target !== -1) {
                    drawPos.x = 0.75 * drawPos.x + 0.25 * inputPos.x;
                    drawPos.y = 0.75 * drawPos.y + 0.25 * inputPos.y;

                } else {
                    drawPos.x = 0.9 * drawPos.x + 0.1 * inputPos.x;
                    drawPos.y = 0.9 * drawPos.y + 0.1 * inputPos.y;
                    if (Math.abs(drawPos.x - inputPos.x) < 1) {
                        drawPos.x = inputPos.x;
                    }
                    if (Math.abs(drawPos.y - inputPos.y) < 1) {
                        drawPos.y = inputPos.y;
                    }
                }
                aniFac = Math.max(0, aniFac * 0.8);
                delta -= 16;
                lastTime = new Date().getTime() - delta;
            }
            if (target !== -1) {
                LIB.css(dragBox, {
                    boxShadow: "0 0 4px 4px rgba(255, 255, 255, 1)"
                });
            } else {
                LIB.css(dragBox, {
                    boxShadow: "0 0 4px 4px rgba(255, 255, 255, 0.2)"
                });
            }
            dist = LIB.Vec2.dist(drawPos, {
                x: boxSize * 2,
                y: boxSize * 2
            });
            dist = Math.min(1, Math.max(0, 1 - (dist / UI.theme.halfBoxSize - 3) * 0.1));
            LIB.css(dragBox, {
                left: (aniFac * ((1 - size) * UI.theme.halfBoxSize) + (1 - aniFac) * (drawPos.x - size * UI.theme.halfBoxSize)) + "px",
                top: (aniFac * ((1 - size) * UI.theme.halfBoxSize) + (1 - aniFac) * (drawPos.y - size * UI.theme.halfBoxSize)) + "px",
                width: (aniFac * (boxSize + size * boxSize) + (1 - aniFac) * (size * boxSize)) + "px",
                opacity: dist,
                borderRadius: (aniFac * (size * UI.theme.halfBoxSize)) + "px"
            });

            requestAnimFrame(animate);
        }
        LIB.attachMouseListener(currentColBox, function (val) {
			var gridX, gridY, off;
            if (val.down && val.code === 0 && !dragging) {
                inputPos.x = val.absX + ((1 - size) * UI.theme.halfBoxSize);
                inputPos.y = Math.max(UI.theme.halfBoxSize, val.absY + ((1 - size) * UI.theme.halfBoxSize));
                drawPos.x = inputPos.x;
                drawPos.y = inputPos.y;
                dragging = true;
                LIB.css(dragBox, {
                    display: "block"
                });
                target = -1;
                aniFac = 1;
                lastTime = new Date().getTime();
                animate();
            }
            if (val.dragdone === false && dragging) {
                inputPos.x = val.absX + ((1 - size) * UI.theme.halfBoxSize);
                inputPos.y = Math.max(UI.theme.halfBoxSize, val.absY + ((1 - size) * UI.theme.halfBoxSize));
                gridX = parseInt(inputPos.x / boxSize, 10);
                gridY = parseInt(inputPos.y / boxSize, 10);
                target = -1;
                if (inputPos.x > 0 && gridX >= 0 && gridX < 4 && gridY > 0 && gridY < 3 && !pageTransitioning) {
                    inputPos.x = parseInt(inputPos.x / boxSize, 10) * boxSize + UI.theme.halfBoxSize;
                    inputPos.y = parseInt(inputPos.y / boxSize, 10) * boxSize + UI.theme.halfBoxSize;
                    target = gridX + (gridY - 1) * 4;
                }
            }
            if (val.dragdone && dragging) {
                LIB.css(dragBox, {
                    display: "none"
                });
                if (target !== -1 && !pageTransitioning) {
                    off = LIB.getGlobalOff(div);
                    UI.spawnGlow(off.x + inputPos.x, off.y + inputPos.y);
                    values[target] = {
                        r: selectedColor.r,
                        g: selectedColor.g,
                        b: selectedColor.b
                    };
                    swatchSets[currentSwatchSet][target].setColor(selectedColor);
                }
                dragging = false;
            }
        });
        dragBox = document.createElement("div");
        LIB.css(dragBox, {
            position: "absolute",
            width: (size * boxSize) + "px",
            height: (size * boxSize) + "px",
            left: 0,
            top: 0,
            backgroundColor: "rgb(" + selectedColor.r + ", " + selectedColor.g + ", " + selectedColor.b + ")",
            cursor: "move",
            display: "none"
        });

        previousButton = new UI.Button({
            im: "btn_previous.svg",
            animated: true,
            touchGlow: true,
            callback: function () {
				var i, temp;
                if (pageTransitioning) {
                    return;
                }
                pageTransitioning = true;
                colorSetIndex = (colorLibrary.length + colorSetIndex - 1) % colorLibrary.length;
                values = colorLibrary[colorSetIndex];
                pageLabel.setText((colorSetIndex + 1) + "/" + colorLibrary.length);

                temp = pageContainer[2];
                pageContainer[2] = pageContainer[1];
                pageContainer[1] = pageContainer[0];
                pageContainer[0] = temp;

                currentSwatchSet = (currentSwatchSet + 1) % 2;
                for (i = 0; i < 8; i += 1) {
                    swatchSets[currentSwatchSet][i].setColor(values[i]);
                    pageContainer[1].appendChild(swatchSets[currentSwatchSet][i]);
                }

                LIB.css(pageContainer[2], {
                    left: (4 * boxSize) + "px"
                });
                LIB.css(pageContainer[1], {
                    left: 0
                });
                LIB.css(pageContainer[0], {
                    display: "none",
                    left: (-4 * boxSize) + "px"
                });
                setTimeout(function () {
                    LIB.css(pageContainer[0], {
                        display: "block"
                    });
                    pageTransitioning = false;
                }, 210);
            }
        });
        LIB.css(previousButton.getDiv(), {
            position: "absolute",
            left: (boxSize * 2) + "px",
            top: 0
        });

        nextButton = new UI.Button({
            im: "btn_next.svg",
            animated: true,
            touchGlow: true,
            callback: function () {
				var i, temp;
                if (pageTransitioning) {
                    return;
                }
                pageTransitioning = true;
                colorSetIndex = (colorSetIndex + 1) % colorLibrary.length;
                values = colorLibrary[colorSetIndex];
                pageLabel.setText((colorSetIndex + 1) + "/" + colorLibrary.length);

                temp = pageContainer[0];
                pageContainer[0] = pageContainer[1];
                pageContainer[1] = pageContainer[2];
                pageContainer[2] = temp;

                currentSwatchSet = (currentSwatchSet + 1) % 2;
                for (i = 0; i < 8; i += 1) {
                    swatchSets[currentSwatchSet][i].setColor(values[i]);
                    pageContainer[1].appendChild(swatchSets[currentSwatchSet][i]);
                }

                LIB.css(pageContainer[0], {
                    left: (-4 * boxSize) + "px"
                });
                LIB.css(pageContainer[1], {
                    left: 0
                });
                LIB.css(pageContainer[2], {
                    display: "none",
                    left: (4 * boxSize) + "px"
                });
                setTimeout(function () {
                    LIB.css(pageContainer[2], {
                        display: "block"
                    });
                    pageTransitioning = false;
                }, 210);
            }
        });
        LIB.css(nextButton.getDiv(), {
            position: "absolute",
            left: (boxSize * 3) + "px",
            top: 0
        });

        pageLabel = new UI.Label({
            text: "1/3",
            width: 1
        });
        LIB.css(pageLabel.getDiv(), {
            position: "absolute",
            left: (boxSize * 4) + "px",
            top: boxSize + "px"
        });

        div.appendChild(gridArea);
        div.appendChild(currentColBox);
        div.appendChild(previousButton.getDiv());
        div.appendChild(nextButton.getDiv());
        div.appendChild(pageLabel.getDiv());
        div.appendChild(dragBox);

        //interface
        this.setColor = function (p) {
            selectedColor = {
                r: p.r,
                g: p.g,
                b: p.b
            };
            LIB.css(currentColBox, {
                backgroundColor: "rgb(" + selectedColor.r + ", " + selectedColor.g + ", " + selectedColor.b + ")"
            });
            LIB.css(dragBox, {
                backgroundColor: "rgb(" + selectedColor.r + ", " + selectedColor.g + ", " + selectedColor.b + ")"
            });
            if ((p.r + p.g + p.b * 0.2) / 2.3 / 255 > 0.4) {
                dragMeLabel.style.color = "#000";
            } else {
                dragMeLabel.style.color = "#fff";
            }
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
	setColor(col, <boolean>hidden)	Set selected color. if hidden no glow animation (when whole bar is hidden)
	getBar()						Returns the ExpandBar object (not div)
	getButton()						Returns object that contains a getDiv() method to get the div element
									that contains both ColorButtons
	getColors()						Returns both colors in arrray: [c1, c2]
	*/
    UI.ColorButtonBarCombination = function (p) {
        var bar, listeners, buttonContainer, button1, activeButton, colSel, button2, boxSize, pickButton, modeButton, MODE_COLSLIDER,
			MODE_SWATCH, mode, colSwatch;
        boxSize = UI.theme.halfBoxSize * 2;
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
            width: (boxSize * 2) + "px",
            cssFloat: "left"
        });
        bar = new UI.ExpandBar({
            width: 5,
            height: 3
        });
        pickButton = new UI.Button({
            im: "btn_picker.svg",
            title: "Eye Dropper",
            callback: function () {
                callback({
                    pick: true
                });
            }
        });
        LIB.css(pickButton.getDiv(), {
            position: "absolute",
            left: (boxSize * 4) + "px",
            top: (boxSize * 3) + "px"
        });

        MODE_COLSLIDER = 0;
        MODE_SWATCH = 1;
        mode = MODE_COLSLIDER;
        modeButton = new UI.Button({
            im: "btn_swatch.svg",
            title: "Swatch",
            animated: true,
            touchGlow: "true",
            callback: function () {
                if (mode === MODE_COLSLIDER) {
                    mode = MODE_SWATCH;
                    modeButton.setImage("btn_colSlider.svg");
                    modeButton.setTitle("Slider");
                    colSel.getDiv().style.display = "none";
                    colSwatch.getDiv().style.display = "block";
                } else {
                    mode = MODE_COLSLIDER;
                    modeButton.setImage("btn_swatch.svg");
                    modeButton.setTitle("Swatch");
                    colSel.getDiv().style.display = "block";
                    colSwatch.getDiv().style.display = "none";
                }
            }
        });
        LIB.css(modeButton.getDiv(), {
            position: "absolute",
            left: (boxSize * 4) + "px",
            top: boxSize + "px"
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
                    if (mode === MODE_COLSLIDER) {
                        colSwatch.getDiv().style.display = "none";
                    }
                    colSel.setColor(activeButton.getColor());
                    colSwatch.setColor(activeButton.getColor());
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
                    if (mode === MODE_COLSLIDER) {
                        colSwatch.getDiv().style.display = "none";
                    }
                    colSel.setColor(activeButton.getColor());
                    colSwatch.setColor(activeButton.getColor());
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
        colSwatch = new UI.ColorSwatch(function (c) {
            activeButton.setColor(c);
            colSel.setColor(activeButton.getColor());
            colSwatch.setColor(activeButton.getColor());
            callback({
                color: c
            });
        });
        //colSwatch needs to be visible to preload the graphics
        setTimeout(function () {
            if (mode === MODE_COLSLIDER) {
                colSwatch.getDiv().style.display = "none";
            }
        }, 1000);
        colSel = new UI.ColorSelection(function (c) {
            activeButton.setColor(c);
            colSwatch.setColor(activeButton.getColor());
            callback({
                color: c
            });
        });
        bar.getContentDiv().appendChild(colSel.getDiv());
        bar.getContentDiv().appendChild(modeButton.getDiv());
        bar.getContentDiv().appendChild(pickButton.getDiv());
        bar.getContentDiv().appendChild(colSwatch.getDiv());
        //interface
        this.collapse = function () {
            button1.collapse();
            button2.collapse();
            bar.collapse();
            callback({
                collapse: true
            });
        };
        this.addListener = function (p) {
            listeners.push(p);
        };
        this.setColor = function (p, hidden) {
            var off;
            activeButton.setColor(p);
            if (!hidden) {
                off = LIB.getGlobalOff(activeButton.getDiv());
                UI.spawnGlow(off.x + UI.theme.halfBoxSize, off.y + UI.theme.halfBoxSize);
            }
            colSel.setColor(activeButton.getColor());
            colSwatch.setColor(activeButton.getColor());
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
        this.getColors = function () {
            return [button1.getColor(), button2.getColor()];
        };
    };
    /*UI.BarContainer(callback)
	Manages all ButtonBarCombinations. Puts all ExpandButtons and ColorButtons on their own bar.
	
	callback		Callback on toggleHide - tells you if bar is hidden or not
	
	add(<ButtonBarCombination> or <ColorButtonBarCombination>)	Add a combination
	addRegularButton(<Button>)		Add a UI.Button - so something that doesn't expand
									The button won't be affected
	toggleHide()	Toggles between showing and hiding the BarContainer. Animated.
	collapse()		Collapses currently expanded bar
	isHidden()		Is the bar hidden or visible
	getDiv()		Return div element of BarContainer
	*/
    UI.BarContainer = function (p) {
        var bars, div, frontDiv, backDiv, boxSize, current, hidden, callback, line1, line2, line3, line4, line5;
        bars = [];
        div = document.createElement("div");
        frontDiv = document.createElement("div");
        backDiv = document.createElement("div");
        boxSize = UI.theme.halfBoxSize * 2;
        hidden = false;
        callback = p.callback;
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

        line1 = UI.createDiv({
            type: "image",
            src: "highlight.png",
            position: "absolute",
            left: (UI.theme.halfBoxSize * 2 - UI.theme.halfBoxSize / 11) + "px",
            top: "0",
            pointerEvents: "none",
            width: (UI.theme.halfBoxSize / 11) + "px",
            height: (UI.theme.halfBoxSize * 2) + "px"
        });
        line2 = UI.createDiv({
            type: "image",
            src: "highlight.png",
            position: "absolute",
            left: (UI.theme.halfBoxSize * 2 * 2 - UI.theme.halfBoxSize / 11) + "px",
            top: "0",
            pointerEvents: "none",
            width: (UI.theme.halfBoxSize / 11) + "px",
            height: (UI.theme.halfBoxSize * 2) + "px"
        });
        line3 = UI.createDiv({
            type: "image",
            src: "highlight.png",
            position: "absolute",
            left: (UI.theme.halfBoxSize * 2 * 4 - UI.theme.halfBoxSize / 11) + "px",
            top: "0",
            pointerEvents: "none",
            width: (UI.theme.halfBoxSize / 11) + "px",
            height: (UI.theme.halfBoxSize * 2) + "px"
        });
		line4 = UI.createDiv({
            type: "image",
            src: "highlight.png",
            position: "absolute",
            left: (UI.theme.halfBoxSize * 2 * 5 - UI.theme.halfBoxSize / 11) + "px",
            top: "0",
            pointerEvents: "none",
            width: (UI.theme.halfBoxSize / 11) + "px",
            height: (UI.theme.halfBoxSize * 2) + "px"
        });
        line5 = UI.createDiv({
            type: "image",
            src: "highlight.png",
            position: "absolute",
            left: (UI.theme.halfBoxSize * 2 * 6 - UI.theme.halfBoxSize / 11) + "px",
            top: "0",
            pointerEvents: "none",
            width: (UI.theme.halfBoxSize / 11) + "px",
            height: (UI.theme.halfBoxSize * 2) + "px"
        });

        frontDiv.appendChild(line1);
        frontDiv.appendChild(line2);
        frontDiv.appendChild(line3);
        frontDiv.appendChild(line4);
        frontDiv.appendChild(line5);


        frontDiv.className = "WebchemyAppShadedBar";
        LIB.addCssRule(".WebchemyAppShadedBar", "background: -webkit-linear-gradient(bottom, rgba(255, 255, 255, 0) 20%, rgba(255, 255, 255, 0.4) 100%); background-image: -moz-linear-gradient(center bottom, rgba(255, 255, 255, 0) 20%, rgba(255, 255, 255, 0.4) 100%); background-image: -o-linear-gradient(bottom, rgba(255, 255, 255, 0) 20%, rgba(255, 255, 255, 0.4) 100%); filter:progid:DXImageTransform.Microsoft.gradient(startColorstr='#88ffffff', endColorstr='#00ffffff'); background-image: linear-gradient(to top, rgba(255, 255, 255, 0) 20%, rgba(255, 255, 255, 0.4) 100%);");
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
        this.addRegularButton = function (p) {
            frontDiv.appendChild(p.getDiv());
        };
        this.toggleHide = function () {
            if (current) {
                current.collapse();
                return;
            }
            hidden = !hidden;
            if (hidden) {
                LIB.css(div, {
                    top: (-boxSize - 10) + "px",
                    pointerEvents: "none"
                });
                if (current) {
                    current.collapse();
                }
                callback(true);
            } else {
                LIB.css(div, {
                    top: "0",
                    pointerEvents: ""
                });
                callback(false);
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
		barHidden: <boolean>		True if bar is hidden
		color: {r: , g: , b: }		Updating selected color
		pick: <boolean>				True if color picking (eyedropper) was initiated
		clear: <boolean>			True on clear action
		clearColor: {r, g, b}		The clear color
		exportSVG: <boolean>		True on export svg action
		exportPNG: <boolean>		True on export png action
		undo: <boolean>				True on undo action
		redo: <boolean>				True on redo action
		zoomIn: <boolean>			True on zoom in action
		zoomOut: <boolean>			True on zoom out action
		resetView: <boolean>		True when view needs to be reset (1:1, centered)
		handTool: <boolean>			Hand tool active/not active
		gradient: <boolean>			Gradient on/off
		splat: <boolean>			Splat on/off
		mirrorHorizontal: <boolean>	Mirror Horizontal on/off
		mirrorVertical: <boolean>	Mirror Vertical on/off
		brushMode: <string>			"MODE_FILL" or "MODE_STROKE" brush mode update
		brushOpacity: <number[0,1]>	Opacity of brush updated
		brushSize:	<number [0, 1]>	Size/width of brush updated
		intentEdit: <boolean>		True on editing via WebIntents (chrome only)
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
		color: {r, g, b}		Color that was picked
		initView: <boolean>		True if view is reset (1:1, centered)
	}
	*/
    function WebchemyBar(p) {
        var parent, callback, barContainer, colorBar, brushBar, brushContent, boxSize, picking, brushState, ignoreAboutClick,
			opacitySlider, sizeSlider, mirrorHorButton, mirrorVertButton, gradientButton, modeButton, resetViewButton,
			splatButton, handButton, moreContent, undoButton, redoButton, zoomInButton, clearCanvasButton, exportIntentButton,
			zoomOutButton, aboutButton, moreBar, canvasBar, canvasContent, exportLabel, exportSVGButton, exportPNGButton;
        parent = p.parent;
        callback = p.callback;
        boxSize = UI.theme.halfBoxSize * 2;
        barContainer = new UI.BarContainer({
            callback: function (val) {
                callback({
                    barHidden: val
                });
            }
        });
        picking = false;

        //Color Bar
        colorBar = new UI.ColorButtonBarCombination({
            callback: function (val) {
                if (val.color) {
                    callback({
                        color: val.color
                    });
                }
                if (val.pick) {
                    picking = true;
                    barContainer.getDiv().style.display = "none";
                    barContainer.collapse();
                    callback({
                        pick: true
                    });
                }
            }
        });


        //Brush Bar
        brushBar = new UI.BrushButtonBarCombination();
        brushContent = brushBar.getBar().getContentDiv();
        brushState = {
            mode: "fill",
            symmetry: "horizontal",
            gradient: false,
            splat: false,
            size: 1,
            opacity: 1
        };
        brushBar.updateBrushPreview(brushState);
        opacitySlider = new UI.Slider({
            caption: "opacity",
            value: 1,
            width: boxSize * 2.5,
            left: 2 * boxSize,
            callback: function (val) {
                if (val !== brushState.opacity) {
                    brushState.opacity = val;
                    brushBar.updateBrushPreview(brushState);
                }
                callback({
                    brushOpacity: val
                });
            }
        });
        LIB.css(opacitySlider.getDiv(), {
            position: "absolute",
            left: (boxSize * 2) + "px",
            top: (boxSize * 2) + "px"
        });
        sizeSlider = new UI.Slider({
            caption: "size",
            disabled: true,
            value: 0,
            width: boxSize * 2.5,
            left: 4.5 * boxSize,
            callback: function (val) {
                if (parseInt(1 + val * 4, 10) !== brushState.size) {
                    brushState.size = parseInt(1 + val * 4, 10);
                    brushBar.updateBrushPreview(brushState);
                }
                callback({
                    brushSize: val
                });
            }
        });
        LIB.css(sizeSlider.getDiv(), {
            position: "absolute",
            left: (boxSize * 4.5) + "px",
            top: (boxSize * 2) + "px"
        });
        modeButton = new UI.MultiStepSwitch({
            ims: ["btn_stroke.svg", "btn_fill.svg", "btn_pull.svg"],
            titles: ["Stroke", "Fill", "Pull-Shape"],
            init: 1,
            width: 3,
            callback: function (p) {
                var mode;
                if (p === "Stroke") {
                    mode = "stroke";
                    sizeSlider.enable(true);
                    brushState.mode = "stroke";
                    brushBar.updateBrushPreview(brushState);
                }
                if (p === "Fill") {
                    mode = "fill";
                    sizeSlider.enable(false);
                    brushState.mode = "fill";
                    brushBar.updateBrushPreview(brushState);
                }
                if (p === "Pull-Shape") {
                    mode = "pull";
                    sizeSlider.enable(false);
                    brushState.mode = "pull";
                    brushBar.updateBrushPreview(brushState);
                }
                if (mode) {
                    callback({
                        brushMode: mode
                    });
                }
            }
        });
        LIB.css(modeButton.getDiv(), {
            position: "absolute",
            left: (boxSize * 4) + "px",
            top: boxSize + "px"
        });
        mirrorHorButton = new UI.ToggleButton({
            im: "btn_flipHor.svg",
            title: "Mirror Horizontal",
            state: true,
            touchGlow: true,
            callback: function (val) {
                mirrorVertButton.setState(false);
                if (val) {
                    brushState.symmetry = "horizontal";
                } else {
                    brushState.symmetry = "";
                }
                brushBar.updateBrushPreview(brushState);
                callback({
                    mirrorHorizontal: val
                });
            }
        });
        LIB.css(mirrorHorButton.getDiv(), {
            position: "absolute",
            left: 0,
            top: boxSize + "px"
        });
        mirrorVertButton = new UI.ToggleButton({
            im: "btn_flipVert.svg",
            title: "Mirror Vertical",
            state: false,
            touchGlow: true,
            callback: function (val) {
                mirrorHorButton.setState(false);
                if (val) {
                    brushState.symmetry = "vertical";
                } else {
                    brushState.symmetry = "";
                }
                brushBar.updateBrushPreview(brushState);
                callback({
                    mirrorVertical: val
                });
            }
        });
        LIB.css(mirrorVertButton.getDiv(), {
            position: "absolute",
            left: boxSize + "px",
            top: boxSize + "px"
        });
        gradientButton = new UI.ToggleButton({
            im: "btn_gradientUp.svg",
            title: "Gradient",
            state: false,
            touchGlow: true,
            callback: function (val) {
                brushState.gradient = val;
                brushBar.updateBrushPreview(brushState);
                callback({
                    gradient: val
                });
            }
        });
        LIB.css(gradientButton.getDiv(), {
            position: "absolute",
            left: boxSize + "px",
            top: (boxSize * 2) + "px"
        });
        splatButton = new UI.ToggleButton({
            im: "btn_splat.svg",
            title: "Splat",
            state: false,
            touchGlow: true,
            callback: function (val) {
                brushState.splat = val;
                brushBar.updateBrushPreview(brushState);
                callback({
                    splat: val
                });
            }
        });
        LIB.css(splatButton.getDiv(), {
            position: "absolute",
            left: 0,
            top: (boxSize * 2) + "px"
        });
        brushContent.appendChild(mirrorHorButton.getDiv());
        brushContent.appendChild(mirrorVertButton.getDiv());
        brushContent.appendChild(gradientButton.getDiv());
        brushContent.appendChild(splatButton.getDiv());
        brushContent.appendChild(modeButton.getDiv());
        brushContent.appendChild(opacitySlider.getDiv());
        brushContent.appendChild(sizeSlider.getDiv());

        //More Bar
        moreBar = new UI.ButtonBarCombination({
            im: "btn_more.svg",
            width: 6,
            leftOffset: 1,
            callback: function (val) {
                if (val.collapse) {
                    handButton.setState(false);
                    callback({
                        handTool: false
                    });
                }
            }
        });
        moreContent = moreBar.getBar().getContentDiv();
		resetViewButton = new UI.Button({
            im: "btn_resetView.svg",
            title: "Reset View",
            animated: true,
            touchGlow: true,
            disabled: true,
            callback: function () {
                callback({
                    resetView: true
                });
            }
        });
        zoomInButton = new UI.Button({
            im: "btn_zoomIn.svg",
            title: "Zoom In",
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
            title: "Zoom Out",
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
            title: "Hand Tool",
            touchGlow: true,
            state: false,
            callback: function (val) {
                callback({
                    handTool: val
                });
            }
        });
        undoButton = new UI.Button({
            im: "btn_undo.svg",
            title: "Undo",
            animated: true,
            disabled: true,
            touchGlow: true,
            callback: function () {
                setTimeout(function () {
                    callback({
                        undo: true
                    });
                }, 50);
            }
        });
        redoButton = new UI.Button({
            im: "btn_redo.svg",
            title: "Redo",
            animated: true,
            disabled: true,
            touchGlow: true,
            callback: function () {
                callback({
                    redo: true
                });
            }
        });
        moreContent.appendChild(resetViewButton.getDiv());
        moreContent.appendChild(zoomInButton.getDiv());
        moreContent.appendChild(zoomOutButton.getDiv());
        moreContent.appendChild(handButton.getDiv());
        moreContent.appendChild(undoButton.getDiv());
        moreContent.appendChild(redoButton.getDiv());

        //Clear Bar
        canvasBar = new UI.ButtonBarCombination({
            im: "btn_export.svg",
            callback: function (val) {
                var selectedCols = colorBar.getColors();
                if (val.expand) {
                    clearCanvasButton.setColors([
						{
							r: 255,
							g: 255,
							b: 255
						}, {
							r: 0,
							g: 0,
							b: 0
						},
						selectedCols[0],
						selectedCols[1]
					]);
                }
            }
        });
        canvasContent = canvasBar.getBar().getContentDiv();
        clearCanvasButton = new UI.ClearCanvasButton({
            colors: [{
                r: 255,
                g: 255,
                b: 255
            }, {
                r: 0,
                g: 0,
                b: 0
            }, {
                r: 255,
                g: 255,
                b: 255
            }, {
                r: 0,
                g: 0,
                b: 0
            }],
            callback: function (p) {
                if (p.clear) {
                    callback({
                        clear: true,
                        clearColor: p.clear
                    });
                    barContainer.collapse();
                }
            }
        });
        //chrome only atm
        exportIntentButton = new UI.Button({
            text: "Edit",
            title: "Switch into different Web App (Kleki is recommended)",
            callback: function () {
                callback({
                    intentEdit: true
                });
                barContainer.collapse();
            }
        });
        exportLabel = new UI.Label({
            text: "Save:",
            width: 1
        });
        exportSVGButton = new UI.Button({
            text: "SVG",
            title: "Save As Scalable Vector Graphic",
            callback: function () {
                callback({
                    exportSVG: true
                });
                barContainer.collapse();
            }
        });
        exportPNGButton = new UI.Button({
            text: "PNG",
            title: "Save As PNG Image",
            style: {
                textShadow: "1px 2px 1px rgba(0, 0, 0, 0.5)"
            },
            callback: function () {
                callback({
                    exportPNG: true
                });
                barContainer.collapse();
            }
        });
        canvasContent.appendChild(clearCanvasButton.getDiv());
        if (window.chrome) {
            canvasContent.appendChild(exportIntentButton.getDiv());
        } else {
            canvasContent.appendChild(new UI.EmptySlot(1).getDiv());
        }
        canvasContent.appendChild(exportLabel.getDiv());
        canvasContent.appendChild(exportPNGButton.getDiv());
        canvasContent.appendChild(exportSVGButton.getDiv());

        ignoreAboutClick = false;
        aboutButton = new UI.Button({
            im: "btn_help.svg",
            title: "Help / About / Send Feedback",
            callback: function () {
                if (ignoreAboutClick) {
                    return;
                }
                barContainer.collapse();
                ignoreAboutClick = true;
                UI.showInfoPage(parent, function () {
                    setTimeout(function () {
                        ignoreAboutClick = false;
                    }, 300);
                });
            }
        });

        barContainer.add(colorBar);
        barContainer.add(brushBar);
        barContainer.add(moreBar);
        barContainer.add(canvasBar);
        barContainer.addRegularButton(aboutButton);


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
            if (p.color) {
                if (picking) {
                    picking = false;
                    barContainer.getDiv().style.display = "block";
                    colorBar.setColor(p.color, false);
                } else {
                    colorBar.setColor(p.color, true);
                }
            }
            //is the view 1:1 and centered
            if (p.initView !== undefined) {
                resetViewButton.enable(!p.initView);
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
		initView: <boolean>			True if view is reset (1:1, centered)
		pick: {x, y}				On using eye dropper at x, y
	}
	reset()						Reset the view - center and set zoom to 1
	resize({width:, height:})	Resize viewport			
	zoomIn()					Zoom-out action
	zoomOut()					Zoom-in action
	enterPickerMode()			Initiates eye dropper mode
	setHandTool(<boolean>)		Set hand tool on/off	
	getDiv()					Return the div element
	*/
    function WebchemyCanvasView(p) {
        var keys, canvas, callback, width, height, zoom, translate, mode, div, canvasWrapper, cursor, cursorHandIm,
			cursorPickerIm, zoomWrapper, gestureHandler, CURSOR_CROSSHAIR, CURSOR_HAND, CURSOR_PICKER, drawing,
			MODE_DEFAULT, MODE_DRAW, MODE_FORCE_PICK, MODE_PICK, MODE_FORCE_HAND, MODE_HAND_SPACE, MODE_HAND_MOUSE,
			startZoom, pinching, pinchCenter, pinchImageCenter, zoomTransition;
        CURSOR_CROSSHAIR = 0;
        CURSOR_HAND = 1;
        CURSOR_PICKER = 2;
        keys = {
            KEY_Z: 90,
            KEY_CTRL: 17,
            KEY_ALT: 18,
            KEY_SPACE: 32,
            ctrlPressed: false,
            altPressed: false,
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
        drawing = false;
        MODE_DEFAULT = 0;
        MODE_DRAW = 1;
        MODE_FORCE_PICK = 2;
        MODE_PICK = 3;
        MODE_FORCE_HAND = 4;
        MODE_HAND_SPACE = 5;
        MODE_HAND_MOUSE = 6;
        mode = [MODE_DEFAULT];
		pinching = false;
        zoomTransition = true;
        pinchCenter = {
            x: 0,
            y: 0
        };
        pinchImageCenter = {
            x: 0,
            y: 0
        };
        div = document.createElement("div");
        canvasWrapper = document.createElement("div");
        zoomWrapper = document.createElement("div");
        LIB.loadImageToDataURL({
            src: "cursor_hand.png",
            callback: function (p) {
                cursorHandIm = p;
            }
        });
        LIB.loadImageToDataURL({
            src: "cursor_picker.png",
            callback: function (p) {
                cursorPickerIm = p;
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
            if (cursor === CURSOR_HAND && cursorHandIm) {
                div.style.cursor = "url(" + cursorHandIm + ") 10 10, move";
            }
            if (cursor === CURSOR_PICKER && cursorPickerIm) {
                div.style.cursor = "url(" + cursorPickerIm + ") 0 16, pointer";
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
                if (unicode === keys.KEY_ALT) {
                    keys.altPressed = true;
                    setCursor(CURSOR_PICKER);
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
                if (unicode === keys.KEY_ALT) {
                    keys.altPressed = false;
                    setCursor(CURSOR_CROSSHAIR);
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
            keys.altPressed = false;
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
            callback({
                initView: (translate.x === 0 && translate.y === 0 && zoom === 1)
            });
        }

        function pinchUpdate() {
            LIB.css(zoomWrapper, {
                left: pinchCenter.x + "px",
                top: pinchCenter.y + "px"
            });
            LIB.css(canvas, {
                marginLeft: (-pinchImageCenter.x) + "px",
                marginTop: (-pinchImageCenter.y) + "px"
            });
            LIB.css(canvasWrapper, {
                transform: "scale(" + zoom + ", " + zoom + ")"
            });
            callback({
                initView: (translate.x === 0 && translate.y === 0 && zoom === 1)
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
            if (!zoomTransition) {
                zoomTransition = true;
                LIB.css(canvasWrapper, {
                    transition: "all 0.3s ease-in-out"
                });
            }
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
                    if (val.pinch || keys.altPressed || mode[mode.length - 1] === MODE_PICK || mode[mode.length - 1] === MODE_FORCE_PICK) {
                        if (tapTimeout) {
                            clearTimeout(tapTimeout);
                        }
                        dblTap.start = 0;
                        dblTap.tapCount = 0;
                        return;
                    }
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
                        if (dTime < maxTime && dblTap.dragDist <= 15) {
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
            var canvasSize, x, y, scroll, currMode, off;
            scroll = 0;
            currMode = mode[mode.length - 1];
            canvasSize = canvas.getSize();
            x = canvasSize.width / 2 - (width / 2 - val.absX) / zoom - translate.x;
            y = canvasSize.height / 2 - (height / 2 - val.absY) / zoom - translate.y;
            gestureHandler.add(val);
            if (val.pinch && currMode !== MODE_FORCE_PICK) {
                if (val.pinch.down) {
                    startZoom = zoom;
                    pinching = true;
                    if (zoomTransition) {
                        zoomTransition = false;
                        LIB.css(canvasWrapper, {
                            transition: ""
                        });
                    }
                    canvasSize = canvas.getSize();
                    x = canvasSize.width / 2 - (width / 2 - val.pinch.absX) / zoom - translate.x;
                    y = canvasSize.height / 2 - (height / 2 - val.pinch.absY) / zoom - translate.y;
                    pinchCenter = {
                        x: val.pinch.absX,
                        y: val.pinch.absY
                    };
                    pinchImageCenter = {
                        x: x,
                        y: y
                    };
                    pinchUpdate();
                } else if (pinching) {
                    zoom = Math.max(1 / 8, Math.min(8, startZoom * val.pinch.dZoom));
                    pinchCenter = {
                        x: val.pinch.absX,
                        y: val.pinch.absY
                    };
                    canvasSize = canvas.getSize();
                    translate.x = ((pinchCenter.x - (width / 2 - canvasSize.width / 2 * zoom)) / zoom) - pinchImageCenter.x;
                    translate.y = ((pinchCenter.y - (height / 2 - canvasSize.height / 2 * zoom)) / zoom) - pinchImageCenter.y;
                    pinchUpdate();
                    zoomStateCallback();
                }
            }
            if (val.dragdone === true && pinching) {
                pinching = false;
                update();
            }
            if (val.pinch && currMode !== MODE_FORCE_PICK) {
                return;
            }
            if (currMode === MODE_DEFAULT) {
                setCursor(CURSOR_CROSSHAIR);
                if (val.delta !== undefined && val.delta !== 0) {
                    scroll = val.delta;
                } else if (keys.altPressed) {
                    mode.push(MODE_PICK);
                } else if (keys.spacePressed) {
                    mode.push(MODE_HAND_SPACE);
                } else if (val.down && val.code === 0) {
                    callback({
                        x: x,
                        y: y,
                        down: val.down,
                        dragdone: false
                    });
                    mode.push(MODE_DRAW);
                } else if (val.down && val.code === 1) {
                    mode.push(MODE_HAND_MOUSE);
                }
            } else if (currMode === MODE_DRAW) {
                setCursor(CURSOR_CROSSHAIR);
                if (val.down || val.dragdone) {
                    callback({
                        dragdone: true
                    });
                    mode.pop();
                } else if (!val.move) {
                    callback({
                        x: x,
                        y: y,
                        dragdone: false
                    });
                }
            } else if (currMode === MODE_FORCE_PICK) {
                setCursor(CURSOR_PICKER);
                if (val.down) {
                    off = LIB.getGlobalOff(div);
                    UI.spawnGlow(off.x + val.absX, off.y + val.absY);
                    setTimeout(function () {
                        callback({
                            pick: {
                                x: x,
                                y: y
                            }
                        });
                    }, 10);
                    mode.pop();
                }
            } else if (currMode === MODE_PICK) {
                setCursor(CURSOR_PICKER);
                if (!val.dragdone && val.code === 0) {
                    callback({
                        pick: {
                            x: x,
                            y: y
                        }
                    });
                }
                if (!keys.altPressed) {
                    mode.pop();
                }

            } else if (currMode === MODE_FORCE_HAND) {
                setCursor(CURSOR_HAND);
                if (val.delta !== undefined && val.delta !== 0) {
                    scroll = val.delta;
                }
                if (val.dragdone === false) {
                    translate.x += val.dX / zoom;
                    translate.y += val.dY / zoom;
                    update();
                }
            } else if (currMode === MODE_HAND_SPACE) {
                setCursor(CURSOR_HAND);
                if (val.dragdone === false) {
                    translate.x += val.dX / zoom;
                    translate.y += val.dY / zoom;
                    update();
                }
                if (!keys.spacePressed) {
                    mode.pop();
                }
            } else if (currMode === MODE_HAND_MOUSE) {
                setCursor(CURSOR_HAND);
                if (val.dragdone === false) {
                    translate.x += val.dX / zoom;
                    translate.y += val.dY / zoom;
                    update();
                }
                if (val.down || val.dragdone) {
                    mode.pop();
                }
            }
			scroll = parseInt(scroll, 10); //to prevent zooming when not scrolling enough
            if (scroll !== 0) {
                if (!zoomTransition) {
                    zoomTransition = true;
                    LIB.css(canvasWrapper, {
                        transition: "all 0.3s ease-in-out"
                    });
                }
                if (scroll > 0) {
                    zoomIn();
                } else {
                    zoomOut();
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
            if (!zoomTransition) {
                zoomTransition = true;
                LIB.css(canvasWrapper, {
                    transition: "all 0.3s ease-in-out"
                });
            }
            zoomIn();
        };
        this.zoomOut = function () {
            if (!zoomTransition) {
                zoomTransition = true;
                LIB.css(canvasWrapper, {
                    transition: "all 0.3s ease-in-out"
                });
            }
            zoomOut();
        };
        this.enterPickerMode = function () {
            mode.push(MODE_FORCE_PICK);
            setCursor(CURSOR_PICKER);
        };
        this.setHandTool = function (p) {
            if (p) {
                mode.push(MODE_FORCE_HAND);
            } else {
                if (mode[mode.length - 1] === MODE_FORCE_HAND) {
                    mode.pop();
                }
            }
        };
        this.getDiv = function () {
            return div;
        };
    }
    /*WebchemyCanvas
	Canvas consisting of an html canvas element and svg element on top.
	
	copy1pxCanvasContext(x, y)		Returns 1x1px canvas at x y -> for eye dropper
	clear({w , h})					Clear/init the canvas
	setSize({w, h})					Resize the canvas - not quite a clear
	copyCanvasContext()				Returns a context of a canvas that is a copy of the original
	addShape(<svg element>)			Appends a shape to the svg element
	addDef(<svg def>)				Appends a definition to the svg element
	removeShape(<svg element>)		Removes the shape
	removeDef(<svg def>)			Removes the definition
	getDiv()						Returns the div element containing the canvas and svg element
	getContext()					Returns context of canvas
	getSize()						Returns width, height of canvas {width:, height: }
	*/
    function WebchemyCanvas() {
        var div, retina, width, height, canvas, context, svgContainer, svg, defs, pickerCanvas;
        div = document.createElement("div");
        canvas = document.createElement("canvas");
        svgContainer = document.createElement("div");
        context = canvas.getContext("2d");
        retina = global.retina;
        if (retina) {
            //now all drawing operations that follow have the correct drawing scale
            context.scale(2, 2);
        }

        function buildSVG() {
            svgContainer.innerHTML = "";
            svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
            svg.setAttribute('style', 'pointer-events: none; overflow: hidden');
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
        div.appendChild(canvas);
        div.appendChild(svgContainer);
        this.clear = function (p) {
            width = Math.max(10, Math.min(3000, p.width));
            height = Math.max(10, Math.min(3000, p.height));
            canvas.width = retina ? (2 * width) : width;
            canvas.height = retina ? (2 * height) : height;
            context = canvas.getContext("2d");
            if (retina) {
                context.scale(2, 2);
            }
            context.fillStyle = "rgba(" + p.color.r + ", " + p.color.g + ", " + p.color.b + ", 1)";
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
            //for easy access by viewer
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
            canvas2.width = retina ? (2 * width) : width;
            canvas2.height = retina ? (2 * height) : height;
            ctx = canvas2.getContext("2d");
            ctx.drawImage(canvas, 0, 0);
            if (retina) {
                ctx.scale(2, 2);
            }
            return ctx;
        };
        //for color picking
        this.copy1pxCanvasContext = function (x, y) {
            var ctx;
            if (!pickerCanvas) {
                pickerCanvas = document.createElement("canvas");
            }
            pickerCanvas.width = 1;
            pickerCanvas.height = 1;
            ctx = pickerCanvas.getContext("2d");
            ctx.translate(-x * (retina ? 2 : 1), -y * (retina ? 2 : 1));
            ctx.drawImage(canvas, 0, 0);
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
        this.setSize = function (p) {
            width = p.width;
            height = p.height;
            LIB.css(div, {
                width: width + "px",
                height: height + "px",
                position: "relative"
            });
            LIB.css(canvas, {
                width: width + "px",
                height: height + "px"
            });
            //for easy access by viewer
            div.getSize = function () {
                return {
                    width: width,
                    height: height
                };
            };
            buildSVG();
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
	drawActionOnContext({action, context, w, h})	draw an action(created by this brush) onto a context(of canavs)
	setSize({width: , height: })				Set with, height of canvas in px					
	isDrawing()									True/false is the brush drawing
	getAction()									Returns current action; undefined if nothing drawn since lineStart
	getPullDefs()								Returns string of all pull shape definitions (svg)
	update(p_update)							Update brush settings
	p_update = {
		color: {r: , g: , b: }		Updating selected color
		zoom: <number>				Current zoom factor of view
		gradient: <boolean>			Gradient on/off
		splat: <boolean>			Splat on/off
		mirrorHorizontal: <boolean>	Mirror Horizontal on/off
		mirrorVertical: <boolean>	Mirror Vertical on/off
		mode: <string>				"MODE_FILL", "MODE_STROKE", or "MODE_PULL" brush mode update
		opacity: <number[0,1]>		Opacity of brush updated
		size: <number [0, 1]>		Size/width of brush updated
		context: <context>			Set canvas context
		width: <number>				Set width of canvas (because might be double with retina)
		height: <number>			Set width of canvas (because might be double with retina)
	}
	*/
    function WebchemyBrush(p) {
        var MODE_FILL, MODE_STROKE, MODE_PULL, color, size, opacity, mode, width, height, mirrorHorizontal, mirrorVertical,
			gradient, splat, zoom, drawing, action, shapeCounter, inputHandler, context, shapes, shapesAlt;
        MODE_FILL = 0;
        MODE_STROKE = 1;
        MODE_PULL = 2;
        color = {
            r: 0,
            g: 0,
            b: 0
        };
        //Pull Shape paths
        shapes = [];
        //shapes.push({path: "M -60.1943159670758,-0.5090612909789769 C -100,-100 1.0472117985863179,100 -60.1943159670758,-0.5090612909789769 z"});
        shapes.push({
            d: "M 67.3546637864118,-98.9514379336631 C 44.286913415615714,-96.94965253644096 21.66678353350369,-90.60714577149133 2.621138627442022,-77.15958638161001 -48.93214465408029,-37.231026874041795 -80.9143333280025,22.676882058398135 -100,83.98071410148054 -96.40976875538459,76.88066419729083 -92.79095639308754,69.78537097839683 -89.00824341762919,62.78553951267753 -64.66984298427877,21.41861577997534 -45.660611324273646,-24.400319354009397 -10.56681236065694,-58.25590392807896 16.671320837192866,-86.07304054295106 57.0513143828631,-96.16894105933845 94.97743239868578,-94.64819596559282 124.96960437090175,-95.61843674818235 153.47248278059405,-78.104034448243 168.88664449887295,-52.84378020341395 174.60249898202858,-41.52172103434949 184.3213501769199,-29.808629529256365 180.27747057518593,-16.35336102872344 179.6385985328908,-2.3520578609760463 155.05498277136803,-16.29779802376129 163.10337630342394,-2.366655964124817 167.59610657107356,11.59015579374514 189.00812039990603,14.922623902425556 191.2440495302157,-2.4362429895275426 191.17622575884508,-23.006282515122024 182.2913937210934,-42.649424502588154 170.49825868412853,-59.14642922605868 155.78529798788128,-81.92791735505338 130.23492694592517,-96.07782593238214 103.5227355205063,-98.92199569191936 91.64947493985449,-99.85328086217382 79.43775159687263,-100 67.3546637864118,-98.9514379336631 z M 45.355732400366776,-52.59561244988571 C 34.53566755362439,-51.53011494365995 23.889098702450056,-49.10092497026049 13.767897540998561,-44.93210036769998 -36.86221973999808,-19.135570861694134 -71.55485790837874,29.25332752689681 -95.65534206513142,79.37890811929267 -92.59019146888495,74.36281945139837 -83.13176879393026,59.517122631857546 -76.9014131865979,51.17738212544282 -57.557573319588116,27.852073648250467 -39.921137438270634,2.841217334181252 -17.570662405332556,-17.806405368821515 12.785313980185279,-47.978921323195046 60.096987172942164,-55.07359945347327 100.2077359285154,-43.65628356077268 127.11991316588964,-36.39495742151577 146.0794046598295,-11.770581787718214 152.14262018729036,14.617047878087703 157.13176797381203,25.28678506712454 151.70652235867612,38.32904206509028 138.3057917154126,34.289263054128185 125.99626928251567,37.86436311879447 151.67211840209825,62.63168534690789 158.2698049307965,46.56729294989526 163.05531737957494,31.20032903140347 158.55955267475383,14.568988954238591 152.26842631217886,0.26785058923432814 143.3529218554517,-23.03100907747782 123.37217822971769,-41.33317587064772 99.36449044213799,-48.133513595303754 81.91479546458248,-52.333092628655045 63.38918748024028,-54.37137328374906 45.355732400366776,-52.59561244988571 z M 21.098072599319224,-16.221773070846382 C 16.135783682355125,-15.78891470894213 11.217084045298392,-15.039941804415818 6.391795866030606,-13.97181992009591 -28.11283021544918,-2.9065397451811066 -54.95849587049988,23.91156993988119 -75.8571977464793,52.57269014746947 -81.97876468062749,65.81325171517457 -97.89992344197029,76.07120757887583 -95.49644417271176,92.0926667905045 -90.7119158657188,100 -89.34756730402162,81.98307030093827 -87.63589870392626,79.53009690106046 -70.2609574961465,52.20814762782874 -49.74578387508281,26.346295710823014 -24.408274500107254,5.973412589551714 -0.66413168145138,-12.817831665007986 31.78433516916769,-16.66779432912908 60.58831995925661,-9.565858153184166 85.32361657343966,-4.330182849443148 104.46656849852346,17.371209670177095 108.26125519903638,42.078704278925386 112.37164638309429,52.577364820949725 105.89078568549374,60.17338117902648 94.98735582835425,58.686670988689315 89.26719572488818,70.93329035914195 111.00545255554968,78.70997874663794 113.87434887744269,63.98676657346016 116.14316474574488,38.66606962065015 104.67725685239486,11.587572421558718 83.45083576190805,-3.041531193399109 64.8756106292233,-13.93573472130133 42.601201555108105,-18.097834354995598 21.098072599319224,-16.221773070846382 z M -96.63747456095999,81.40119647037545 C -96.68664064431749,81.37003198050735 -96.8587424390232,81.6795035660787 -97.24460803067892,82.6163245338756 -97.46714709188146,84.60224064480963 -96.48997631088712,81.49489496951819 -96.63747456095999,81.40119647037545 z"
        });
        shapes.push({
            d: "M -16.67075212335132,-98.00091730851192 C -24.131373290111327,-100 -27.107894798389424,-88.46294407471018 -18.963487800493112,-90.40560997177556 -17.835151912038285,-85.2759307923043 -17.442912363472757,-80.2640841581463 -22.023848950103115,-80.51399627470629 -23.32450600937061,-71.78296173530924 -18.70986217341411,-63.63401996975988 -16.753770507549362,-55.32621850902913 -14.473996410392118,-47.56116089337785 -13.221400746879794,-39.501807569098524 -10.355106228717531,-31.909820967730155 -11.96987628832477,-42.64722239232559 -15.286076888592305,-53.079937420206434 -17.720532981597188,-63.65972888873737 -18.10059650048055,-66.9498277948764 -22.14482369662477,-77.2976676832997 -18.97070058053953,-77.00979920441608 -18.39667755070421,-68.09451741234739 -15.230088576152625,-59.72826386777474 -13.520659705143672,-50.98783843158455 -13.067932783317232,-42.68792818070657 -7.805924084775938,-30.311083275651953 -2.048768748095185,-29.753842456815732 -7.9144014401278895,-28.379343669151922 -3.691997152737258,-20.282855239683002 -11.144227213997596,-21.8353882912657 -15.57101740725912,-27.36434126518948 -15.925407713996805,-36.41588032783872 -17.96483912554683,-43.72167667142348 -20.90194029139282,-55.48511391104251 -22.230412972720558,-67.7746199052377 -26.79103237199233,-79.02105792558666 -31.296199061303057,-82.81312347476037 -28.716987471722348,-91.02255261357055 -27.2000184247252,-91.28103436978965 -32.391541837070164,-98.43889730875829 -46.03747896198095,-93.08912121737447 -40.90008710681652,-83.85337060888547 -40.10564580358137,-73.8933426218706 -37.48376454986454,-64.30191626069487 -34.09857835034079,-54.88591756470843 -30.991834026075665,-44.8082712733717 -30.168791550478062,-33.98920832419091 -25.71968458727099,-24.389747925834783 -23.52117923954809,-14.820852575596334 -32.15262742473942,-8.088008056889606 -35.64322019207056,-0.1947986215020734 -35.19431390125875,5.577424998245888 -33.79778399830464,10.625299825804206 -37.22242624709231,16.49382477122178 -38.46855897402843,23.596413534389 -30.346861521228846,20.122817219048358 -31.906893007513276,14.50338313305663 -33.073149551459736,10.149649117889453 -25.944459094164117,1.7793964081426452 -27.549695429650413,10.393990968670991 -29.487755145399106,13.916184282245354 -33.22604620571168,26.937251848676567 -25.853335259121806,21.777150448415313 -25.52383261422756,16.83796721720057 -19.905683974184697,8.177703618655258 -16.788513255000794,16.746879088990156 -16.403343659154075,20.069649746329674 -6.525334265043611,30.973980610119042 -11.390997129349188,22.677176853617453 -11.416384686839464,20.89429902936331 -5.427599131538372,30.653261845875335 -0.8976876077118021,28.352849199872367 8.55123278729846,28.96107937468048 14.244651429014127,21.504064597943696 13.553438576839966,12.695296285471812 15.886023078396704,4.169825977398659 12.134306249284748,-4.058349248165925 10.84950302338676,-12.364115419477656 8.467321732302736,-20.23822169979161 6.632419053951068,-27.989282237332958 3.8398948505213184,-35.67010743650121 1.6127526236041234,-43.91042298491621 -0.8409137449700665,-52.0581864250124 -2.892128411051374,-60.360953222443456 -5.080778673166307,-71.65488132923687 -7.548049344699308,-82.96148536135942 -10.712174547848775,-94.0508490281226 -10.288191625712415,-97.39904294978429 -14.145422143127533,-98.22404930113696 -16.67075212335132,-98.00091730851192 z M -36.93437923404911,23.446944736000574 C -41.57776706969567,33.467959991923095 -44.440990800313365,44.33769093558857 -50.5484658648936,53.68006214417028 -59.47292431276403,68.3140787217811 -73.04762630800818,80.5139605678743 -89.45088070008245,86.00606409126382 -97.40600578200731,83.863797003804 -100,100 -90.76814143618944,94.73359936113334 -66.23415576284162,88.15536542461044 -47.01431076262834,68.52724850830245 -37.23031745694516,45.54072551640556 -33.811031232944416,39.315382199680045 -32.4434238638398,30.72049781036776 -26.211403369546687,28.418621184256324 -26.944393215059264,24.183469557872655 -34.02180866172753,25.268385938720968 -36.93437923404911,23.446944736000574 z"
        });
        shapes.push({
            d: "M -63.16851622484734,76.61343753452431 C -66.63719512096355,67.19224076514135 -67.0270100398725,53.64280292218643 -57.441230508849024,47.71231581228878 -46.85136653909338,42.599299616113996 -31.431970460634133,45.44379514889067 -26.20880044761364,56.83097836352255 -34.094388213800926,59.20932886195234 -48.20671206083881,52.27780274237648 -49.60858137111046,65.06841037998862 -51.305274132352416,75.85590325643835 -40.14358226044076,83.34519646743195 -30.58676670361143,84.22104890408295 -21.110428229442917,90.25987553266663 -9.846228511501494,83.47090141136201 -7.381439665029092,73.472628234432 1.1740129003079858,59.54523320696961 -3.8173157264339466,39.38831585505446 -18.2545285368043,31.50713424154077 -22.86368821545321,27.027178510415865 -36.097891753140324,28.001132640422583 -33.31624869232837,19.43945962425238 -25.12436851894661,15.16393641792095 -14.678870845622,23.12533592864365 -5.764835208270071,18.167895799672905 0.4990939848562306,15.017885416055904 7.881861975323275,12.535018384348035 11.223734389341104,5.6743146893678755 15.190308537601283,-1.038523705587295 15.903392510771425,-8.946336624232643 17.66896380572345,-16.373684512340887 19.232500041307787,-27.14420074172392 14.873065545085012,-37.48265482361944 9.619959612427124,-46.586608600486 5.652478315086967,-56.10934127045579 0.8278707299602388,-66.32597819019219 -8.895536275758033,-71.12861980831292 -21.677914775288016,-80.31842876595643 -38.93914746777456,-82.40208540614204 -53.97475468906976,-78.55039520921609 -72.52323192594567,-72.02553106289037 -80.79882900013055,-49.01148288744259 -75.65380340070766,-31.013774734796556 -71.92606864591482,-16.112295984601772 -56.90951155529761,-2.610224282890499 -40.919713094664715,-5.820689673047227 -27.136036400004883,-9.884069587405847 -24.157801174304467,-28.349218701655772 -31.379226221273754,-39.34613342283871 -36.44403392348775,-49.309610952918035 -22.432144438868377,-55.54943589906409 -18.78158215223077,-44.844752774337195 -12.004076987150484,-36.248608093130464 -8.792056484285581,-24.193892748412154 -13.496078038147473,-13.866842826378416 -18.466088661511463,-1.2284418451023527 -33.03120949214885,3.809086588351647 -45.36565073529293,5.7827190044169186 -57.63484204104651,8.466649150049975 -67.5571090843529,0.006836016280772128 -75.26994974718095,-8.318135886396362 -81.33223265911654,-14.385472914634363 -88.3687288865102,-19.492657438152733 -91.59753164735373,-27.721795520173814 -100,-41.00712338814999 -99.80107516604892,-59.09606481968956 -90.37074210950396,-71.81293419637771 -84.53408013301394,-78.96146333514 -79.27430017498278,-87.35110200794212 -70.43225329675818,-91.07358825734391 -50.695669950654434,-100 -27.77071677412637,-96.31755790283982 -8.714560034316321,-87.4816018827231 4.1738253148370745,-82.19415387775447 15.980759368015313,-73.6955277226378 24.199400439254546,-62.41551769216082 28.19979828892218,-55.65939532682144 31.049931105267206,-48.246302638540286 35.183226295141424,-41.59132739561059 40.109045799040956,-28.116988537199475 40.091874762885595,-12.67640404808796 35.1488842228307,0.7459033309542633 30.955587600956903,10.2971464005782 25.943200156288967,22.253371273763605 14.206246174989474,23.912935719092232 3.7404024437299057,25.81613448873894 0.8629903586249839,40.79180507439756 9.808063453782069,46.469975147355086 17.813783676694484,57.571859976355825 19.869059509951597,74.97285842351101 9.305243678061828,85.1955862013553 3.3725534918275173,94.27323265490466 -6.766910959754242,98.12557081545893 -17.16471851002042,98.31944153310792 -33.63679629935021,100 -51.331257473855594,93.25230116183116 -61.37015797029289,79.89887231649917 -62.05350041291486,78.85254064918828 -62.6583744601249,77.75443668795984 -63.16851622484734,76.61343753452431 z"
        });
        //shapes.push({path: "M 23.57917264796616,-100 C 23.432316777153318,-100 20.17726748726578,-96.40215908831671 16.35684015117971,-92.00479797403713 3.9378395429047828,-77.71048541962985 -6.247749350629334,-68.1982844215301 -10.70689738616565,-66.72661291474583 L -12.159380408087884,-66.24690079318805 -12.159380408087884,-63.1554226764824 C -12.159380408087884,-60.25480602254053 -13.013950241699916,-56.554072190917815 -13.971626200639463,-55.333471348287404 -14.20163217252221,-55.04031394066877 -14.933097215473538,-54.80045787988988 -15.597317279251925,-54.80045787988988 -16.830241393271393,-54.80045787988988 -16.937824831732797,-55.02364127937731 -17.409563071803504,-58.59815752168356 -17.452587918972313,-58.92406327680057 -22.622434792731056,-53.89633911425534 -28.896003315770173,-47.43152535875541 -39.80171472564802,-36.19334146782961 -40.29537047953935,-35.611973017578975 -40.28914488222829,-34.052887301977535 -40.27895366471247,-31.503590485325788 -39.90358425972828,-31.17691719081438 -37.477520156970314,-31.694324024857167 -36.33729774537434,-31.93750608967889 -35.37284185511703,-32.10952019620011 -35.3321196261313,-32.06743345273544 -35.29144003822314,-32.025389350348235 -37.071960869135914,-28.72543900588302 -39.28976594952191,-24.738498262269474 L -43.327321652094184,-17.48951509206313 -41.02205972181386,-19.834774353012236 C -39.75310389733034,-21.12466694653429 -27.745547045580807,-34.03949800365136 -14.34473562851774,-48.52420296897034 L 10.027326534498073,-74.85506830780807 11.479766915342367,-72.56311039369872 C 16.848065363654882,-64.1710905007832 20.30318658904031,-56.62575184214786 26.36414669980465,-39.99598747460994 32.51563381804169,-23.117796189721233 35.15925269806107,-18.1692991491186 41.35517181902364,-11.892873673889113 46.0542185564164,-7.132764913556926 52.55416855975318,-2.987881618987913 59.690835131898496,-0.2198787159833273 62.86695578738585,1.012022012176999 63.32389757357376,1.39562114511331 64.79441777126621,4.097530378036637 65.87229892759837,6.077909939059495 65.95928672564108,6.5655959421045225 65.78053532887918,9.654217106619512 65.63376474022104,12.189229162318213 65.71397260694565,12.987214286125507 66.10034340991771,12.838951259756044 66.38394921618274,12.730131230047988 67.45880285601444,12.516200944371931 68.48555736045765,12.372585795446895 70.19388684721045,12.133625197294975 70.53203059156209,12.255408114554413 72.4831583734391,13.785071486700346 73.65578800391364,14.704370475914914 74.67401429286306,15.398567217155914 74.74846561412858,15.330810545053168 74.82295957647202,15.263053872950508 74.29502039629344,13.419211041992284 73.56253196748307,11.2266068383922 69.72474971286576,-0.26081415035625355 58.15588426614613,-16.645307040276464 48.750712372500715,-23.925631402424557 46.41624130415207,-25.732717624602003 46.25676367440761,-25.987796550038382 44.16679654428199,-31.294563923559025 41.27637110785574,-38.63369033154081 39.50612677661391,-45.288043676402836 36.424797236346535,-60.34379795122414 33.457873706936255,-74.84065562362254 31.238490906683722,-83.90623397628266 28.81600865443329,-91.4717845056396 27.371371590766216,-95.98359427185356 26.854007397800686,-97.05085779989528 25.471370460777393,-98.40095959480743 24.572496547672102,-99.27868353348705 23.72602851877903,-100 23.57917264796616,-100 z M -51.32252367805706,-17.07640833351637 C -51.52336315294944,-17.028650326747922 -51.76415731743266,-16.66573211638537 -51.93553180779177,-16.010381396721314 -52.08217447321723,-15.449608586889639 -51.953696906794654,-15.144255831114023 -51.5624223799135,-15.144255831114023 -51.20329922544597,-15.144255831114023 -50.9627609074277,-15.583544211228585 -50.9627609074277,-16.236933441328944 -50.9627609074277,-16.8515192909301 -51.12172684424223,-17.124166340284717 -51.32252367805706,-17.07640833351637 z M -44.59324996007727,-13.425266074993331 C -44.93979399669039,-13.477970446748415 -45.44905638493617,-12.761344498757353 -46.352194405789106,-11.199956164972335 -47.47889959582633,-9.252026463905509 -47.77244077314221,-8.389098979108667 -47.444872016004034,-7.988528697338566 -47.0900982514385,-7.554655734062905 -46.76474683032868,-7.646461973859729 -45.8857863004023,-8.414939472056588 -43.92787858720715,-10.126808168239535 -43.66998535065766,-10.595518891809533 -43.95363379800025,-11.946175020728873 -44.1501665240678,-12.881805542615211 -44.32371570937771,-13.384287999542934 -44.59324996007727,-13.425266074993331 z M -56.49275432151305,-12.159380408087884 C -56.667795944534774,-12.159380408087884 -57.69275952372442,-10.717429732301454 -58.78471223562241,-8.947952940454101 -60.41726852770774,-6.302628417335924 -60.699680383803475,-5.573636556877943 -60.33045129397523,-4.88374656446166 -59.95107362770872,-4.1748386514929905 -59.726781560207115,-4.121409381420861 -58.931312259970696,-4.537287810003278 -55.30891008766361,-6.431319189145796 -54.466365037898115,-7.900261666971886 -55.49337538880666,-10.467041325387058 -55.8667406631495,-11.400156023702507 -56.317755339568876,-12.159380408087884 -56.49275432151305,-12.159380408087884 z M -50.49639544311845,-1.65901508065663 C -50.8817002191535,-1.606907683986094 -52.43502938929653,-0.16244118462887513 -54.1075403709731,1.7123164274963898 L -57.358922528198,5.350112028770823 -57.358922528198,8.295032762205821 C -57.358922528198,10.659309943707342 -57.2109153482934,11.329073347557014 -56.61270367244147,11.666321629281498 -54.79470133443118,12.691285208471115 -50.58398021624546,5.8501213032051 -50.21654205167116,1.2725589955297636 -50.08972748726986,-0.30742084803296166 -50.17117194524092,-1.4991963222923914 -50.42974743903017,-1.65901508065663 -50.444671816145245,-1.6682255533905561 -50.470682873402914,-1.6624690079318611 -50.49639544311845,-1.65901508065663 z M -62.98221461979189,1.1126549550104983 C -63.56852943502916,1.1178571664620023 -64.07570241047847,1.206763812990701 -64.22144961327716,1.352511015789375 -64.41580764439351,1.5468690469058402 -72.53522312903209,14.424431802312583 -82.2773021757823,29.975334268736475 -97.69409845355707,54.58452346357268 -100,58.46665243876049 -100,59.90404051925751 -100,61.499328509632534 -99.93842628413066,61.56648820665063 -98.18775420744842,61.956142372587976 -97.1910190215448,62.17800389867372 -96.20792898043264,62.331341213262306 -96.00239898701857,62.28929711087511 -95.79691163468166,62.24725300848789 -87.80392694474753,48.50637899858714 -78.25305048938098,31.747625371696927 L -60.890158076870186,1.2725589955297636 -62.38259578838326,1.139305628430364 C -62.58676126731819,1.1206714775751152 -62.78679056173852,1.110949311911554 -62.98221461979189,1.1126549550104983 z M 50.656256842560424,2.39188727916455 C 50.47234587542485,2.5194267418826968 51.83784109930434,4.77036393946419 59.17116832074987,17.143056337604733 62.9533892514211,23.52450678664728 66.13095970354232,28.665443009880107 66.22025011976817,28.576195234731642 66.5609096876907,28.235535666809426 65.30406392920924,23.308828216794936 64.10150026234942,20.274489143901505 61.20868692558497,12.975061579045999 55.28443410919522,4.89125139409677 51.20257432712933,2.671740670611939 50.960458289244514,2.5400650233790003 50.7175747119652,2.349374124925177 50.656256842560424,2.39188727916455 z M 71.75028617493146,20.287835801150152 C 71.71446766985522,20.280927946599704 71.69621728869723,20.285789029431527 71.68363817084281,20.3011398173214 71.61251285361985,20.388042333208915 71.70918017624851,21.063647564672138 71.91019021545074,21.80692418608308 72.15900090249858,22.726820150382295 72.65990563956004,23.29134537503144 73.45592927380355,23.5658686317949 74.66459061474177,23.98272780515933 75.25482840910621,23.879280551212716 75.25482840910621,23.246060550756397 75.25482840910621,22.860585210411315 72.28735054568887,20.391581542639074 71.75028617493146,20.287835801150152 z M 79.25242942208766,21.100660019917683 C 79.16343749340433,21.100660019917683 79.09252538156838,21.943716762612596 79.09252538156838,22.979553816557626 79.09252538156838,24.651681028536856 79.22398782341423,24.912218011889607 80.26515501204295,25.271511730667 82.40262430247208,26.009202370929188 82.68593162119498,25.074851081367072 80.95807252095975,22.966207159309022 80.1136086227084,21.93570024004798 79.34146399184891,21.100660019917683 79.25242942208766,21.100660019917683 z M 69.71148833777195,28.602845908151522 69.71148833777195,30.188539656095486 C 69.71148833777195,31.70549598715479 69.76747607249243,31.760929387868174 71.20392604928503,31.760929387868174 72.02476679061729,31.760929387868174 72.6963637607981,31.698929261224123 72.6963637607981,31.627676020768803 72.6963637607981,31.55642278031337 72.02476679061729,30.850883512464975 71.20392604928503,30.055286288996086 L 69.71148833777195,28.602845908151522 z M 79.09252538156838,29.202464739560043 C 78.85799945547382,29.202464739560043 78.66611460685039,29.40714191142473 78.66611460685039,29.655526187697944 78.66611460685039,29.903867822893744 78.85799945547382,29.98706056504119 79.09252538156838,29.842080901637104 79.3270513076634,29.697143879310374 79.51893615628643,29.4924667074458 79.51893615628643,29.389019453499202 79.51893615628643,29.285614840630046 79.3270513076634,29.202464739560043 79.09252538156838,29.202464739560043 z M 86.96777805660327,32.73370028823234 C 86.94206548688769,32.73237841483078 86.92782336701202,32.74700430440362 86.91447670976348,32.76035096165222 86.54895739367504,33.125912918818045 87.63557997088913,37.24789795478472 88.8466718532431,40.07593949486957 91.47464145783047,46.21241695383654 95.76582628920534,52.517710438514456 101.2125843200657,58.26504542447378 103.1740738837687,60.33480068387763 104.95702525609727,62.036094392847616 105.18353465962727,62.036094392847616 105.65045445794362,62.036094392847616 105.37345801868688,60.31164657881044 104.38401445703099,57.132370483590364 103.33555564415457,53.76355479900815 99.80133522005909,47.15005160636403 96.94847657288548,43.23406561566358 94.37107928617999,39.696135417828174 87.76597638579796,32.77442251721797 86.96777805660327,32.73370028823234 z M -79.35903211576687,39.91603545435032 C -79.74177842715386,39.945671003193155 -80.03199360042682,40.319590611543475 -80.2918483265401,41.03536373798511 -80.52590520078272,41.68031003474604 -81.39510092396809,43.67565661396165 -82.22400082894254,45.47272218293318 L -83.74308921387549,48.737408356329354 -81.21127523898724,47.88458680689331 C -78.90716461779827,47.1064724251878 -78.60688615024179,46.86346092467605 -77.82663971466296,45.09961275505492 -76.74338578256898,42.65073567584935 -76.74858799402058,42.06727781280267 -77.89328771875124,40.84880902404598 -78.50254343366821,40.200280876777356 -78.97632844545743,39.886442546584846 -79.35903211576687,39.91603545435032 z M 82.69036629325169,53.081468123769184 C 82.60815429588615,53.081468123769184 83.56890041240328,55.240172670779174 84.8224201668418,57.87858933934692 86.07589728020315,60.51700600791466 88.15912712008779,64.92084856596986 89.45963734190025,67.65938648444148 L 91.83154727626925,72.6297583977871 93.6704437422407,73.04282251525649 C 94.68410743590073,73.26937455986413 95.65747531134946,73.47076836876349 95.8291482892507,73.49588396339439 96.00077862607475,73.52099955802527 93.89618560637658,70.14322924717388 91.16528044077234,65.98039405898928 88.43437527516849,61.81755887080459 85.44212294573953,57.212322503850004 84.51591610197465,55.74653546575681 83.58975189928728,54.28074842766361 82.77257829061764,53.081468123769184 82.69036629325169,53.081468123769184 z M 108.60812487354275,66.35350348686754 C 108.45581094481332,66.33717195419578 108.59213446949067,66.58060986548239 108.98123430142101,67.19302102013233 109.33877973602205,67.75562739629532 110.57421967361276,69.71451585427246 111.72629630474583,71.55038480374344 113.91502017029578,75.03833965878184 114.42935684676092,75.23193015050381 113.63179813372804,72.26995298608009 113.15029508691669,70.48192732553241 110.79944984481872,67.48519768296916 109.20778634602857,66.63335687831494 108.8939906569137,66.46539367415349 108.69954734364225,66.36335357576348 108.60812487354275,66.35350348686754 z M 95.4560388613724,74.94836698531634 C 95.09887719646869,75.30552865022017 97.18875904443917,81.64843156522818 98.42756762715004,83.98294527465438 100.30897724736079,87.52838030212487 104.54076305781749,91.8771305880866 109.0745329789292,94.90972137680365 111.19967899796882,96.3312043354037 113.1713597791877,97.37232888295517 113.5118487828,97.2416339805041 113.84918234667958,97.11217566929975 114.21329450721132,97.00177791972524 114.31136898539629,97.00177791972524 115.09391803915898,97.00177791972524 113.28337788970623,94.74107591540272 105.05028129252784,85.44873231274755 99.85928444434339,79.58989090919943 95.53867726951276,74.86572857717596 95.4560388613724,74.94836698531634 z M 125.35809443847356,91.88484862310901 C 125.29438866873099,91.88484862310901 125.3954480223392,92.60441680544568 125.58464648308149,93.48388902830158 125.77380230274625,94.3633612511575 126.15134640268164,96.19398534809937 126.42412137526864,97.54813804537139 L 126.91718015407528,100 128.59612993844993,98.68077034517745 130.27516500497973,97.34823667418365 127.87660439719085,94.616563969185 C 126.55656456189632,93.11303957752932 125.42175756713897,91.88484862310901 125.35809443847356,91.88484862310901 z"});
        shapes.push({
            d: "M -65.95465172758927,-68.71486729167208 C -55.09949447853547,-47.608889037283255 -49.62990168605202,-37.38299034349858 -49.19628526387844,-37.38358657104766 -32.72331305364702,-37.24367183953684 -19.76653319119275,-35.777786787438515 -2.3432935132828447,-35.86654519524062 -2.048041630992387,-35.8833588121239 -1.4987173157995528,-34.756806732442456 -1.0897449656533809,-33.29585049474957 3.2864459988758625,-24.300843701730386 3.101575710166543,-6.751601268454252 7.639861071031291,1.4988763098126014 7.877040390044044,1.571814813313182 8.722888539631953,1.637837077244896 9.519528042171515,1.6455482868792615 14.618386544654612,1.695154418960371 26.71763219755954,3.2251935553367304 37.33688207970525,5.163370323290508 44.10259406682033,6.398197325879764 57.69852986185796,10.6888495113717 61.40766144450819,12.759706783241057 65.28838731577557,14.926397696494732 68.02054043654974,17.328757485636913 68.94536886213544,19.387531212512215 69.56178865084829,20.75968929389967 69.7493618377799,21.827453337244634 69.35712360751052,21.73102346831132 68.70441343531203,21.57055876060987 -0.7210775978231112,18.422795289643346 -0.9486377790444891,18.543312751558332 -11.367674450218587,31.607612315358324 -14.93709004387442,45.80541994691194 -26.626608125071144,59.07136366780108 -36.5427467328718,58.4594354599578 -45.056558145303086,50.40758115253172 -55.2576537730472,51.346599793784776 -55.76615637538177,52.94770925400803 -59.40962343062975,61.622581601689774 -61.618328511839955,66.49105777921932 -66.7485088348999,77.79910947453274 -72.88846013503364,88.16261748663854 -77.44948163976888,93.21198910255038 -81.11707603650191,97.27229871159201 -85.82492851231694,100 -88.01471330597053,99.33345734866356 -88.66611177756106,99.13519181435223 -88.39931982361209,98.1896544185629 -82.26560903849172,78.95924903947741 -78.72795249894868,67.86778693848282 -74.78959129793968,55.71619250677114 -73.51374383997576,51.955745606399205 L -71.19398144062892,45.11844656489467 -72.73721708009089,44.347444846964294 C -75.19605949237982,43.118898107891766 -76.8094909886169,41.65818036121854 -76.56948952587194,40.87779799651642 -76.4364910339302,40.44529453243439 -75.3850636254292,39.93595721153119 -73.7597870752177,39.51668999903811 -70.23727471542067,38.607959717276856 -68.83443078950864,37.36120816370661 -67.89421969315751,34.30367379516326 L -67.15962760422266,31.91474900012642 C -78.0184417155772,20.172087170057623 -89.12687642746819,8.659052443380276 -99.95575991586044,-3.111234596461287 -100,-3.1646168363530194 -98.06305543564764,-6.582272644523528 -95.65147399374685,-10.706100361790845 -87.45191424816906,-24.727265644812093 -80.02212401692022,-36.18723611962389 -75.3704759247291,-41.98837117788323 L -73.04586420798327,-44.88742826388865 -76.04246412101354,-52.420803094659426 C -84.37084876568977,-73.35828744368625 -87.54564121887995,-88.41299330873692 -85.22440812491212,-95.96139307374372 -84.7185686722967,-97.60642463008047 -83.24127579975983,-99.7411974952083 -82.46939961475756,-99.94260316127792 -82.24931215215099,-100 -74.81765374124838,-85.94755264490509 -65.95465172758927,-68.71486729167208 z"
        });
        shapes.push({
            d: "M 57.67166535368983,-52.31350076731812 C 56.46726812572206,-53.61798839851291 55.14143745818504,-54.81232346293422 53.666768017444525,-55.85750726460081 43.94231192894489,-31.457198149936843 36.013014564825596,-6.312163937018369 26.93531810030106,18.35629246147083 25.27146748530606,25.927726791635394 17.72940717294773,34.879708709740044 23.743893563559,42.07512436302915 20.215136556371476,47.30069963285604 10.09900606448484,48.85305397600766 6.895738173754836,56.109905075049056 3.285733883273295,58.4122030919591 4.9943642509453525,71.04412446208835 0.4426726981317586,63.760024274188396 -9.65755207560241,49.56646762123896 -17.833216201833196,34.08432905524725 -27.442332397010404,19.54862759276486 -36.14107278287884,11.888821217540553 -22.508903608535547,14.668134534251536 -20.274384575265685,8.161633345385027 -17.42394863671747,6.334413193058893 -10.733859836561692,17.296671642541938 -4.087925809980746,13.163309851826881 1.223771580137793,9.504369697638253 2.393826206436316,11.100191337352186 1.4855753260751214,17.110740359619214 -0.47504661562879846,26.272965247724557 9.269065065636923,33.309948698590404 17.639722671773157,31.100553825231458 27.441988658504243,27.708136009202192 25.59105054924737,15.403859933433466 27.123218067395968,7.142917408699162 27.849068796762182,-8.215100307583484 30.639194251942257,-24.010322154852943 26.87491387006753,-39.161628033062634 23.96066756517841,-51.51140258747599 15.372110995038682,-61.865400125683315 4.058426796354112,-67.46880651178226 2.6939411713421606,-47.91639779544871 2.7768446492571144,-28.274710814357178 2.0929612666076736,-8.684928347708393 -3.4533532784996765,-23.122039356809026 -8.087760815497731,-38.0293533934959 -13.176465661929441,-52.68058224303128 -17.786249022298335,-63.96076756183469 -18.902555445802236,-77.85764663494065 -29.370174184800632,-85.65507340848293 -38.39202876653803,-92.23288471291745 -48.62206169981184,-98.35586747568132 -59.81278126012662,-100 -50.490155485425966,-73.56813381552558 -40.236217101490624,-47.47441257432957 -30.55294713583004,-21.171854566112955 -26.824103069053578,-11.789230797595224 -31.158864375472433,-21.00576636968701 -33.04751997355078,-25.021038359029887 -42.9195336280942,-43.811597549706924 -51.125415493919334,-64.57334082891606 -67.55024128880686,-78.77577218511759 -77.19391882833911,-84.54642297898165 -88.89783997847572,-86.2740527113625 -100,-86.34911270154407 -81.35327974970839,-55.20399786632138 -61.89236797394587,-24.528179838986603 -42.73841468425902,6.310851480903608 -28.908658366735764,23.192943235960527 -17.761218609252722,41.99840817822661 -5.852273064619396,60.236673336235356 1.315831001900932,67.48418099769793 4.104019021864062,75.38051071417306 6.933455662576307,84.92112919974241 8.348033362634482,87.2788003651128 10.351841360304604,89.23007886923781 12.395710518429581,91.04083082221939 16.889872744880165,95.83401430014683 31.574162988925167,100 32.9489607691244,92.67705736089451 26.591954581518777,94.49184042908573 18.430883717325756,93.38697112315307 14.175088520477601,87.94962168452491 4.338261189391474,79.66411748107171 3.29751473935103,63.13738884356056 12.874163270165724,54.263591811148785 16.839124441776505,48.435786678382925 17.72925092817212,52.922386657696165 18.66690707529466,57.738850607182826 25.323215754973248,65.43940561987463 17.44963527782042,73.49385504922179 22.14669696982014,81.49543124651771 23.77617373419085,88.41513736884426 34.781305750089075,86.22646055272531 33.82896259406337,92.51746894713207 36.03360762624513,97.11225280904671 35.82752076727439,87.20002174927276 40.375681188160314,88.61359948276731 41.25318309669029,92.6502457574075 45.76800088247052,89.72943717194457 48.80346188424326,85.72485232525045 57.74644410327531,76.34860334357572 53.65001857750386,62.038050602683 47.89867963789965,52.129506919612396 49.139356902753605,48.09445434168293 47.78915205022835,42.9496576208233 44.165148227856264,38.63527063313822 49.04642251024737,26.163875145424797 54.776387164554194,13.981594990417491 59.94708926920259,1.604446351325123 63.008486903719216,-7.306130701254645 69.81319687122965,-15.61832151237445 68.32187173741386,-25.490772652289422 66.95144881093051,-34.857178213103495 64.17554163032679,-45.26917381200069 57.67166535368983,-52.31350076731812 z M 43.28989624409439,55.23971542201559 C 44.80275190798315,56.90856586982875 46.08692771835453,58.78440939631082 47.05320790836066,60.81065414375212 45.16095868044417,62.25982443712036 32.48935113732145,55.52345593444218 27.499142997406125,62.29222960357265 22.859704378634916,63.81436620713001 21.57055998440063,51.80379906046892 21.54912320119304,48.227981126881076 29.486795285282653,45.99449330912998 37.88701440295597,49.27969596016638 43.28989624409439,55.23971542201559 z M 49.58852938354883,71.28692884331687 C 50.03673314673546,71.7736625681579 50.07982545583644,72.74812998440368 49.548936957420494,74.43122995574839 48.258480107071534,78.65090136048579 46.913400083184825,85.83403617441542 41.274713626763145,85.43304958240466 L 39.94466435028582,85.60279390657877 38.82523303127056,85.714790161704 C 37.523932793497266,84.30596226938667 31.861872118651064,75.31891902364515 36.892016423200914,74.59359952651587 39.931071054811696,74.95889981178755 47.83015067933678,69.37718020053708 49.58852938354883,71.28692884331687 z M 25.811230686974014,72.47660781342628 C 26.762198888974638,75.79474686315177 38.05494628773363,87.54116659224206 30.209083633766028,85.4537363906895 25.400181931416796,86.05812243153125 19.71674697127321,67.6303011118066 25.811230686974014,72.47660781342628 z"
        });
        shapes.push({
            d: "M 24.26643784099629,97.74431878381111 C 22.15149280426489,97.17579329321185 20.25973671760339,96.02006980162034 18.306843894666102,94.10351494272888 15.338124545644277,91.18993195023876 13.80714653619681,87.45480046114804 12.251453675914405,79.33066393362657 11.385552722042874,74.80851760198806 9.526735782929038,46.1768034970045 9.95549019011355,43.96518101320396 10.324156878459917,42.063564162627074 8.383894225473725,40.02393857793098 -0.6059754131293147,32.86259025483781 -6.780743816304465,27.943747488914454 -10.854749898507592,23.3041531649381 -10.854749898507592,21.19109635959478 -10.854749898507592,20.29544527118678 -10.164957992096717,18.355056736108082 -9.321799736277072,16.879005279704785 -8.478641480457227,15.402869901906385 -7.144626985134252,12.214905908380885 -6.357276457006563,9.794612875849793 -4.56454761647494,4.283578785930175 -4.653336452411793,4.093664668987799 -12.543626012695185,-3.4494840407731857 -17.404185369773344,-8.096295604721831 -18.887579948241537,-9.153537339251216 -20.91566634112155,-9.417050519630777 -22.271332556360974,-9.593117606393946 -28.826222918303543,-9.453766129954417 -35.48202875776404,-9.10733861128972 -48.93018054639118,-8.40739221608085 -48.92031978247579,-8.405713788180279 -57.89063573603786,-12.877926889778706 -61.233770388965105,-14.544647755679634 -63.017561600926406,-15.031601650314215 -65.78004412167343,-15.031601650314215 -72.33824937871933,-15.031601650314215 -75.35555921546087,-17.29974519366438 -74.9660380604507,-21.93677991509253 -74.80419565014421,-23.864244555337237 -74.24708346926849,-24.687639322628414 -71.8932561815974,-26.478563853166875 -69.7273708580858,-28.12648632658218 -68.9703159535621,-29.16312535863287 -68.82412488342783,-30.681095551851314 -68.71741882965307,-31.78940345525359 -68.19018266540633,-34.095269665667615 -67.65254024817656,-35.80529397140164 -66.68509440632428,-38.88222995930861 -66.6932347816418,-38.938792979555714 -68.43900960165661,-41.26526189244846 -72.32138117831927,-46.43893197436621 -79.36691797627756,-53.76174506148811 -81.50028375921687,-54.840512633841534 -82.74378903000492,-55.46929368606893 -86.23206573562862,-56.73344362003328 -89.25197713561587,-57.64973937161758 -94.63679344741746,-59.283563050668626 -96.5526349744511,-60.57725331568183 -98.13371405672869,-63.64722382780164 -100,-67.2707818222062 -97.83990525274504,-70.54963268654414 -93.08571626386143,-71.30983464338127 -90.98445041451916,-71.64585590906275 -90.71993017739926,-71.89837538669408 -90.71993017739926,-73.56878879397607 -90.71993017739926,-74.60316194836106 -90.09366676702265,-76.29652785718254 -89.32821972299644,-77.33190806830777 -88.56273071827262,-78.36724631873551 -87.93646730789602,-79.4967024136842 -87.93646730789602,-79.84178719002846 -87.93646730789602,-80.18691392707021 -88.7728698914162,-82.64132100667912 -89.79515836491743,-85.29613237760846 -92.12829902871472,-91.35534101983372 -93.03976930008504,-98.80881971901019 -91.5189457794356,-99.39236713931894 -89.9355588587949,-100 -86.74562271248622,-95.07805214246075 -81.88334296681,-84.52527240360313 -77.2860030652289,-74.54735422066919 -76.05101581603577,-70.33315744807621 -75.35396470895522,-62.24414202437287 -74.85144339554344,-56.4132834980116 -73.10143054507986,-52.327822145387536 -67.98595995061217,-45.04373878206977 -66.28201994601758,-42.61740340909683 -64.79854144615439,-40.37716372959266 -64.68931775052894,-40.065479668468505 -64.58013601560089,-39.753837568041874 -62.652125886288566,-38.9279671195974 -60.40487877029982,-38.23028660205421 L -56.318871928608026,-36.961814716245996 -56.669243752838874,-38.71329619112254 C -56.86188531511958,-39.67667184531607 -56.768229038271336,-40.87146074629201 -56.46111869317597,-41.36844324763207 -55.46295762074448,-42.9834265734999 -53.20429719503228,-41.01442084271768 -47.78973074869415,-33.80939143351378 L -42.65097196710694,-26.97130832405827 -35.906293370314586,-24.926060005895494 C -32.19675790670665,-23.801261548370675 -27.076965360395192,-22.266045508474463 -24.529069846727936,-21.514571376719985 -21.853739694714903,-20.725500459994137 -18.189983352093165,-18.98383778833559 -15.857346216666087,-17.392226570982288 -13.635862968950136,-15.87639637333693 -8.927704865237914,-12.940616171862658 -5.394781977460681,-10.868219282409115 1.4666312798118355,-6.843265255598311 10.44760525054214,-0.8753630911606933 12.642946983707645,1.1179798441789615 15.611120843661894,3.8130734847205474 21.56844891232639,16.866878638123623 25.499914505078763,29.290392154188822 27.300951563717916,34.981647439925354 27.42112700139421,37.45854545340103 25.995134657123444,39.494520457413586 24.764847006051724,41.2509952552941 20.381170976205127,43.38771789403455 17.96654263783826,43.40790098953812 16.50643624648977,43.4201115525143 16.1785553561258,43.81042996077721 15.557746836425608,46.27583074313446 13.992067330135228,52.4935669005626 15.485364633216392,61.06320015357616 18.897440712156936,65.44209266390635 19.783734565019657,66.57947933068488 24.854810741519003,71.93055924168624 30.16653151825355,77.33346061411575 39.958647732601236,87.29362942200189 41.81775839659787,89.77459762313634 41.81775839659787,92.88187119534487 41.81775839659787,97.46234289652594 32.65794793306861,100 24.26643784099629,97.74431878381111 z"
        });
        shapes.push({
            d: "M -3.9651706101391966,-99.95098211696578 C -11.155754323340972,-99.81539428456337 -19.492798375129823,-87.82627528394578 -8.799437992984565,-83.49541185334907 -2.1030977118113583,-79.21696358480871 5.628017360095811,-88.02070884226784 2.44264361693736,-94.52898546328562 1.0942878393183548,-98.51059647726424 -1.364310855883673,-100 -3.9651706101391966,-99.95098211696578 z M 17.248834915292406,-93.20192334525201 C 11.638592604366366,-93.13610106419765 6.93766842314092,-92.32979328770455 14.89803916334715,-90.79422316968557 44.87368795264183,-90.18471491369091 74.74972366775106,-77.15129660793812 94.37010200330255,-54.26212919609448 116.11614568988432,-30.60050546658593 120.61656974310515,5.735213646384494 108.03887215189718,34.87852907524862 109.492664910597,36.85447148651596 110.9568315034538,29.885378232420038 111.868394263937,29.41861636105321 119.59423142022024,8.846757236507713 118.97265069055769,-15.012818661738919 109.51759851199174,-34.94386603072837 94.55167443389806,-67.48179119109815 60.88439666144535,-88.68700019049022 25.79893689432882,-92.51943425597759 24.307410072204334,-93.00955242062187 20.615053100684364,-93.2413560481879 17.248834915292406,-93.20192334525201 z M -20.193244510664442,-88.86050408340802 C -41.594161048012126,-82.95384917779778 -61.36480831459784,-70.54995880799179 -75.1146884998466,-53.01089919909137 -99.61453016237773,-23.65124989535157 -100,22.59633409327229 -75.89193740756066,52.28200085174649 -73.59756075366201,53.79591331599923 -72.84002819741575,59.11951020943022 -69.19978305946823,57.83673405007835 -80.01708346022562,45.40973004978227 -87.96325842737522,30.204722460503604 -90.52753676644558,13.835115489287148 -96.65750210206636,-20.91377099184774 -77.02511195854333,-56.40089833763845 -47.530724142156735,-74.2818091481443 -39.78134869550545,-81.76437686016185 -26.9296848174386,-80.48869858733856 -20.193244510664442,-88.86050408340802 z M 12.604147835023255,-58.39497979225628 C -14.81711112378359,-58.30428457550382 -43.80269574090414,-44.53292873357925 -54.98119970055407,-18.545200190732842 -51.45082013955541,-18.258615438934484 -51.010690509094424,-22.82273847382092 -49.46444322843428,-24.971942115218695 -28.8020102185298,-55.05290655420044 14.766940592509869,-64.21136414099186 47.03193078286651,-48.555731755701636 54.1757412438167,-47.681963724339916 62.094495316001655,-35.10554011276534 66.91887419026452,-37.560074206280326 53.888731832140394,-50.157184820471926 36.0341499340565,-57.12773405129155 18.06406054921868,-58.224327187089344 16.255616126883638,-58.34019866802395 14.432247943129695,-58.40098569624191 12.604147835023255,-58.39497979225628 z M 12.642063895538499,-33.7874565178617 C -10.233575065913257,-33.92158837354043 -33.99026194234564,-17.868049682779002 -36.705658532205554,5.834826720570248 -40.1911454775544,30.73718528153134 -17.269825246393623,52.238624878517015 6.423829971038188,54.026139635447805 12.227413857743713,54.66919602178632 18.13704138249844,54.419617345050796 23.865217808051284,53.28680678824884 44.59310910482927,49.97712903229723 62.82011771571803,32.06455072804911 63.14625650184601,10.517490527051464 63.83748145146316,-13.88868329958288 40.1454035421487,-32.3459182299205 17.191991157368008,-33.54097179166426 15.68123330935019,-33.696154644141004 14.167078182310206,-33.77847799473173 12.642063895538499,-33.7874565178617 z M 76.09456083495402,-32.08123379467564 C 71.61324647623292,-31.92872023285919 65.86899364102166,-27.892631423132272 71.84796205724649,-23.606963936669842 74.43923663140367,-22.480159283853496 77.77421198293106,-23.382318861329082 79.33641434185603,-25.768179386038852 81.63776755088952,-30.462915666188124 79.16072648385256,-32.1855181275168 76.09456083495402,-32.08123379467564 z M 78.9761814341127,-17.540394254230492 C 85.3754417979371,-4.647659699413481 86.03518125090244,10.701064925642072 81.76304221483178,24.356852615116225 75.20471639393404,47.23243091087116 53.83073542597623,61.80536260493648 32.206751121405375,68.79447553898439 36.34554695585615,68.93060936265837 40.35627750431033,67.58941213726465 44.07447806267734,65.89386657671977 68.16076166995683,56.34278060008094 87.14688014520945,32.40306531632922 86.76796220284422,5.910658841600764 85.43786679996933,-1.6884476740164303 86.80460428372635,-14.34986392684202 78.9761814341127,-17.540394254230492 z M -57.71115605765178,-13.86253638425164 C -62.11220969947435,-13.853861189605738 -67.13981865809896,-10.624808144733777 -61.2752657460849,-6.222480523277923 -59.06084648060086,-4.9258119193534355 -55.68480045232333,-4.827351493407335 -54.01437049026378,-7.094549915128596 -51.23721622103668,-11.921719411445636 -54.288154780032094,-13.869270276599124 -57.71115605765178,-13.86253638425164 z M -60.13778393062751,0.659314793087546 C -63.03068834939546,1.2462554098635223 -60.8191810373591,14.217309379280735 -60.2515927778702,19.06753184039107 -53.93944835468556,49.5552597765805 -23.517178705369787,70.07446107628238 6.423829971038188,71.92252019864384 8.11191365087376,71.0255172053983 15.370018284641091,74.43693133492437 14.348286618724558,70.6902785647467 -1.86662282558963,70.86863571341047 -18.199405718833987,66.24457497006154 -31.643894786268703,57.116328900288664 -50.516811071247005,45.25296988918805 -60.949551619834686,22.738231158144657 -59.49327156756528,0.7161585510120574 -59.73344706129304,0.6392344474387386 -59.944927680422765,0.6201854186358275 -60.13778393062751,0.659314793087546 z M 105.55540052099707,39.788689244821285 C 100.97598973051083,39.878959801696084 96.49497870027389,42.57421538021015 100.51250380677237,48.471467102812596 102.91061880224066,50.68600769969024 106.64271180518071,50.16677000057027 109.23319772527896,48.60414298176764 116.04328618799818,42.921465828832964 110.74535088432378,39.686346214278586 105.55540052099707,39.788689244821285 z M 95.96257654494286,54.670712664206974 C 95.58517524499831,54.76899109306251 94.84657038616146,55.26135388848928 93.63076915610372,56.244259508438006 64.94481241559882,89.34170439061916 15.417398193860762,100 -25.444649224874468,86.04628307342128 -35.76012298150066,84.75622703045065 -43.14720288671656,75.39969594352749 -52.914804735321646,73.96998746646713 -36.150142746384574,85.61780125675057 -15.998757566529079,91.83985712015084 4.262614521669164,93.34509438975778 33.77768934067308,94.86325345278811 64.35574849943396,85.72445155176797 86.59737026337407,65.87493887931046 89.34194705340653,64.63863264372614 98.00070129545531,54.1403124768712 95.96257654494286,54.670712664206974 z M -63.512373982181344,62.21600870674092 C -68.45438364258683,62.22395591302484 -73.35926589653575,65.05352534430816 -67.6641522757523,70.57653038320095 -65.07991492242662,71.983246561165 -61.73128978911374,72.28111513257275 -59.11411096241282,70.76611068577719 -53.5884972985564,65.01263666464857 -58.570303656078906,62.208061500456836 -63.512373982181344,62.21600870674092 z M 22.29173162951706,68.64281129692341 C 20.016767998602305,68.74436567340746 18.542712897163256,70.17880607482022 21.286925693014553,73.98897582957309 22.42574215380202,74.21307491364243 23.57195982960212,75.18433271980103 24.737287199901942,74.33022037421031 32.135044267759014,71.99076910757128 26.08327701534469,68.47349333708655 22.29173162951706,68.64281129692341 z"
        });
        shapes.push({
            d: "M -99.43513440611007,-99.02582119437392 C -99.93274614257618,-98.96135102310204 -100,-98.28424720357853 -98.8391472010452,-96.4671125575144 L -98.47509672613428,-96.14298014201803 C -95.16323396408856,-96.32920874556247 -98.34031064267242,-99.16762216693816 -99.43513440611007,-99.02582119437392 z M -93.22701322445776,-99.54915419088125 C -94.60543893302389,-99.2407217652801 -95.28805445112816,-97.7573510887971 -92.3570556283488,-94.7302594200635 L -91.73384397272108,-94.59352475629524 C -87.70379018355312,-97.96061585158945 -91.21229253535058,-100 -93.22701322445776,-99.54915419088125 z M -87.62089200995787,-93.55860591884054 C -85.06095855119156,-85.23532865172999 -83.27878700319192,-73.52541881254069 -74.87812326106584,-68.56160534066888 -73.37259444281571,-67.436216703286 -71.80860821538148,-66.36182519620115 -70.19896953506026,-65.3902630555576 -63.40343490168975,-59.957843856919645 -63.457104370693465,-67.44707307927743 -67.45720569686898,-71.4872038123138 -71.30503939055097,-80.70410000782209 -80.98742358433523,-89.3938773936569 -87.62089200995787,-93.55860591884054 z M -43.23251100460717,-92.2212117441492 C -48.9270977650062,-90.18644851475035 -42.92591581186625,-79.45750967539708 -42.458813275621985,-74.60454258608338 -39.10079699718197,-63.58621173440628 -32.65021675172201,-53.58197774776967 -32.34356588525796,-41.76667755087949 -31.58423197681492,-30.103255270422608 -18.504971245913694,-25.23943180511749 -15.856794936140815,-14.66220386102843 -19.885735250847375,-4.098727326528305 -30.170286432953972,-22.381922296741564 -37.997622175289244,-18.725272167954216 -40.462743283730504,-12.921731931580325 -26.760159549755286,-8.321968934619306 -22.090637377834085,-3.8806533534093006 -11.963531484464411,2.2449593707087416 -25.54129473140054,0.43985024881982326 -30.113220866845495,-0.2560712890888368 -31.136336875017307,3.295132808274488 -18.529746052663228,6.735768891694789 -14.659308827430323,9.866469358992163 -4.017555038346515,13.486319156854918 5.255348922532406,21.32094815690739 6.9802322095314935,32.94356159838142 12.178432055371104,42.07889578964682 2.0658570037129778,56.08551372510374 15.865647058102937,59.313253491647146 27.70906248512503,61.89228303741359 37.85437368592625,67.84330296610102 47.543216031582716,74.93641364908126 59.420870798269306,76.97440595441597 68.82215836446207,84.33246788530872 76.34857763380558,93.50309921697684 86.14219792620935,100 90.29378745275741,83.04195098541092 84.55132129055062,77.57941230261224 68.98550506783974,69.00677243003832 54.67735824843788,57.99283980248072 42.79202050797295,44.69416892910755 34.54128610197387,36.840777884392935 28.55140591460963,27.449511588346212 24.340746567923915,16.933803108208295 18.317573494186107,9.907612240313384 10.992860123389917,3.933766085182455 5.683368505208165,-3.78138710524199 -0.8692060008478961,-11.612731355635617 -5.257631545176565,-20.74049392056868 -10.013113945460432,-29.679912280481943 -18.443117739624327,-41.98658875685862 -23.75455793811261,-55.946830481029295 -30.555938312401224,-69.14066773393189 -35.094849930087335,-76.69080400928746 -38.81524647174746,-84.71561444721974 -43.23251100460717,-92.2212117441492 z M -54.565120022804045,-43.108692644582526 C -60.6318856216765,-41.30135657377222 -51.16334419806043,-28.495342475515343 -45.73933173160021,-26.45779555996492 L -45.03288786003835,-25.750627930003702 -44.12752177608088,-24.661705581207187 C -40.79127392334663,-27.306597141321333 -49.480494571950985,-38.918799596588215 -53.1325237817264,-43.327212007485926 -53.68079860615245,-43.31095528036029 -54.160706098694305,-43.229226254948294 -54.565120022804045,-43.108692644582526 z"
        });
        shapes.push({
            d: "M -100,-97.34227124092735 C -88.04170204366706,-73.19207441548144 -76.08346392010863,-49.04187938501876 -64.12516596377569,-24.89168435455609 -57.81436391713226,-17.947845571525505 -51.50350203771431,-11.004006788494934 -45.192699991070896,-4.060168005464362 -54.030778595426845,-22.91877041817733 -62.868917032557306,-41.77736684761283 -71.70699563691326,-60.63596926032579 -57.734307664990375,-43.24221676348541 -43.76161969306735,-25.84846426664504 -29.788931721144465,-8.45471176980466 -15.130141325222539,12.23543768322159 -0.47129109652621537,32.925587136247884 14.187499299395583,53.61573658927418 11.919597818689766,44.68022031181425 9.651696337983822,35.7447100176318 7.383794857277877,26.809193740171906 28.91928568008055,51.20612716568877 50.45477650288325,75.60306657448314 71.99026732568606,100 70.72959076916229,71.14274864124931 69.46885437986424,42.28550326577604 68.20817782334058,13.428251907025341 27.841996577080707,-24.381167190299664 -12.524124836404908,-62.19058030434723 -52.89030608266477,-100 -46.33981394179087,-78.75522406310483 -39.78926196814274,-57.51044274125998 -33.23876982726884,-36.26566740269255 -49.128679389162755,-56.67183255860311 -65.01864878383104,-77.07799173123622 -80.90855834572508,-97.48415808380227 -87.27237223048338,-97.4368626689532 -93.6361861152417,-97.38956665577639 -100,-97.34227124092735 z M -20.976940206425013,-61.87620095783834 C 3.7504496320809153,-38.51476344240579 28.477779637812574,-15.153331910250657 53.205169476318474,8.208105605181885 35.69403105939065,7.324028497261509 18.182952475237116,6.439957372618551 0.6718140583092946,5.555880264698175 -6.544437363268813,-16.921480142813976 -13.760688784846906,-39.39884055032616 -20.976940206425013,-61.87620095783834 z"
        });
        shapes.push({
            d: "M -30.32187057593832,98.44207804768007 C -39.51257509775715,100 -44.13457419264456,89.44522289856681 -45.80668417304445,82.03319031512277 -48.8854509115493,67.03720231320233 -47.85874416872106,51.636051315474674 -45.208568491643234,36.66482795052906 -41.91755760567558,13.192676624393968 -32.229064847210765,-8.868981645474662 -28.9150869281478,-32.31976686338122 -26.187423949724362,-41.53734958137147 -35.54672256715634,-46.29947633980239 -42.04402432566636,-39.60831505741192 -54.86288562811725,-30.004835427546084 -64.72479429024841,-16.84670959564673 -77.9539745393985,-7.772049920973956 -85.03678760387254,-1.4633654504662559 -93.03367166691547,-8.800533119400711 -93.90354275833042,-16.429437094176123 -94.83212147762056,-21.945154082060654 -100,-32.41998095335063 -89.7774708513667,-29.344908396559504 -79.92457135691387,-29.704754855979445 -71.0599733271114,-35.630683780261634 -63.83056037919649,-41.89529481033536 -50.33072443064141,-54.491758675646594 -37.88584932824354,-68.21953642156097 -24.18891140137501,-80.58584764822403 -20.76102884119652,-83.39131219144764 -6.898626764293297,-91.45911363088085 -15.175175694419522,-82.5032057833138 -19.23716831015038,-77.3459280482358 -18.72313819374631,-76.2327387942492 -13.942823067780168,-80.39627065123288 -1.7705070100714266,-88.18883144395437 10.594216107583037,-97.25316652787473 25.236566785366037,-99.39060340258246 34.46123544636629,-100 43.07476108490948,-95.98529113374902 50.494466264676674,-90.8972088820276 53.687941278972545,-89.89120884402837 64.79133862510687,-81.65986690219422 55.57694802864091,-85.23235379402445 46.354182712924825,-88.39914771412715 37.73431259010118,-93.49109671753472 28.1701717235336,-95.5082028344821 23.558239210371184,-95.80624175100728 14.395577309072038,-94.38044326086258 13.028087167258633,-91.61658542258469 22.96976714507626,-89.7557350711874 18.553836899618673,-77.98797716845125 19.369737578087708,-70.96483025653762 20.043817884607137,-64.4531852263388 24.77604181972734,-56.44404573449409 32.375591980565105,-57.923726660736016 40.64626168859135,-59.31771855932023 47.79539576207739,-64.92787915953483 56.497490401175895,-64.62174117045313 69.30878061905204,-64.19349617949538 78.97900126278918,-53.82272392599259 86.5582490739294,-44.55176210099137 94.37050864441053,-34.11644994669703 101.10386751471606,-20.869582121304205 97.1373382391254,-7.539875633558083 98.15524729708471,1.0403330032002174 83.76887541173792,10.749191556205375 84.59818410031968,-2.9358102809034676 85.64735031750075,-11.71208885986556 84.98189850960281,-21.192512141524162 79.05120149390103,-28.254777959207473 72.52890246732585,-35.82490874643666 60.92116091745575,-37.487016435885636 51.98622370526368,-33.38422413360949 39.17772506047092,-29.348139853886366 27.141392449173793,-18.468089079739997 12.874339164861823,-22.70441120487358 4.020103792717464,-24.453175244350206 -0.2605620478804127,-33.79853460685236 -1.5820335303795616,-41.847328817312516 -3.2060100233715474,-54.56447957743501 1.5984564394222645,-66.66162043305623 3.9806833970547757,-78.91800792871047 3.7276230673875403,-88.53494167194147 -13.37249622752735,-75.68712710399383 -11.239988171174346,-72.04730472011528 -5.674099001599799,-70.55207646595781 -1.093254461411803,-68.52938284629774 -5.047390844374618,-62.30728269477284 -8.151873892496312,-48.20820935999567 -9.777584544525013,-33.59500820375655 -7.804619119544952,-19.252136217464823 -12.771250600547774,-2.5276949850776873 -21.593002213176092,13.18247046401477 -23.456123466980188,30.794479669303144 -24.340459982554535,37.51516226001627 -24.795613284835767,44.7489909689904 -22.974492516968454,51.26720414768886 -20.21705275898873,56.30058383297836 -16.9696496283088,61.17248793401751 -14.516279853611309,66.30608086334527 -13.114487200121445,75.87248882562903 -13.332356790312957,87.65810433678661 -22.23201866990547,93.66218588733256 -24.686657341459124,95.60159322012507 -27.291321917964993,97.52041058659935 -30.32187057593832,98.44207804768007 z"
        });
        shapes.push({
            d: "M -16.885404600059246,-26.312617553136263 C -11.859470010140555,-27.606291286935814 -8.780151192249164,-16.034883716497944 -4.080122210155935,-13.014502354842719 -0.7486934869829014,-8.587159166581216 8.156928187811019,-1.966248884900935 6.469435962216295,2.2440780155766475 -1.6301760385811548,2.7401101624483744 -2.022228414217082,-7.577461664161703 -5.905651025357486,-12.44296937745169 -9.447616041772903,-17.04909434452759 -16.07995398441524,-20.07508916027784 -16.885404600059246,-26.312617553136263 z M -42.29323449181659,72.30809146753708 C -37.14654329773527,67.00423118231822 -36.95504040022476,55.72612341187721 -32.78276250299069,52.433526373641314 -25.406089187341365,56.46211102721003 -34.18261920617019,65.89312811825917 -37.28516435743804,70.38435388800309 -38.249794133114555,71.82247305306976 -46.6619705765048,77.69747497483286 -42.29323449181659,72.30809146753708 z M -23.55481827617662,98.47742490607502 C -17.28459767556241,88.49722700704172 -13.370071090622488,76.9804928023143 -13.585588085551734,65.10594600487374 -13.331877240442296,55.47483176472997 -14.608639459075548,45.805363580423176 -17.345814565172716,36.56819743196547 -17.612891987258067,39.267796193244635 -18.64379558946159,50.40688648078739 -18.875194923953472,42.15993210998661 -21.50335365129267,20.721955250682413 -27.774641545125547,-0.2879074280685643 -37.840588830751074,-19.41411192881864 -38.484293700289115,-22.889122083986578 -43.21768830133554,-28.958155371718547 -40.323519445129584,-21.827371166590865 -38.622787701275364,-18.414007359494974 -35.238324669834725,-7.742401666400482 -39.71442536996642,-16.01227742965807 -41.19997047155426,-18.95821254814095 -47.060070947046164,-28.36321817874797 -44.04496760447433,-20.137856166229383 -43.40919119884605,-14.404288384152366 -49.46783362474252,-25.227401431977142 -50.81031061155018,-27.014782138136454 -52.664453049707774,-32.29750747645254 -61.88533281188443,-36.62566354826458 -58.0782470776178,-27.809135445481203 -53.877558851373934,-15.338068303462464 -45.16473607299879,-5.040569212885217 -39.99586042701644,7.016436442625306 -35.8228710009699,14.21855903471969 -35.18648471350234,23.234348240243136 -29.532219358742267,29.546482970256704 -28.274236418407966,28.636701901319356 -30.920056307340815,20.264658224123195 -28.468280490248418,26.551856410436244 -27.876517224016055,30.354274007458628 -24.518024994228327,36.35533088186247 -26.68325799386743,39.17026084010968 -27.773015193554286,36.626728300308855 -32.32563065276287,30.196426422774948 -30.96330709443781,37.05238516528499 -31.3245350254505,39.69839818346696 -34.98979782035863,46.44881433252817 -34.449340863849415,39.83497613900835 -34.59286639000901,32.23470235288602 -37.13391366131516,24.86086498778903 -43.880731507525006,20.705137758966316 -47.89896341687319,16.993536650150304 -56.544038487609946,9.623381446657504 -56.670080734379084,7.185826041115945 -49.94084781453297,11.572271569710082 -45.01836443158949,18.29575635322172 -38.40307776870152,22.74350517135329 -39.23627800802934,15.680834602967565 -43.73753633402829,8.086456341290898 -47.016870983435766,1.3299718679295864 -54.96319934864625,-13.115130317137286 -65.27342972261684,-26.202630445784223 -71.84391548206646,-41.41418638522653 -63.530590720114255,-47.72030005678254 -76.37419401891428,-48.46298874882359 -80.93544947084497,-49.442378173243796 -87.34891606844246,-50.53904076005507 -93.90372278227592,-51.285839547457506 -100,-53.68908427131254 -87.07307159491859,-56.39808004114669 -74.14182319347597,-59.25612686660372 -60.99030580110715,-60.65136955955223 -57.13669116485788,-68.25736607026576 -55.60921668682456,-76.95868139480484 -50.21031394048853,-83.78516429390866 -46.39311433238842,-91.08612941921334 -40.23615387166338,-97.5506510043928 -32.23447872954502,-100 -34.33859648654699,-95.89338528510133 -40.19282684933645,-91.62584104929154 -42.9173723190134,-86.80749600686218 -49.240144404772444,-78.72667446553069 -49.06368525929572,-68.07147764332001 -48.22977349115557,-58.37959147319118 -47.670384785887656,-52.67882771054042 -46.52863515940852,-47.04718668495804 -45.03968488421839,-41.52006695486124 -41.16368250212163,-46.3830843173078 -46.80437798595922,-59.42299130016262 -37.891768081757704,-58.01723475254108 -35.030126256976075,-53.21122660324912 -38.5141270869236,-44.81559142592534 -36.07406608349262,-38.66221910335425 -34.187447437397296,-29.78637490935948 -31.633516412237967,-20.464094667892013 -25.762920886763112,-13.351551012105261 -19.63386252018165,-7.4234207586244025 -11.29365213381773,-4.6756718261399755 -3.89542965984991,-0.7494990392455065 -0.15515139871951078,-0.1153540675370408 1.4903860386866086,2.6225656026388435 -3.5731579313164445,2.1908963191979325 -8.757687211171742,1.4071574970296865 -11.249918523598097,5.140930351875127 -7.047375240093373,8.049527995927022 -11.05488339376889,7.639997423249241 -21.021089586941045,-0.27685840208164336 -18.900454196793916,9.060516414906175 -17.09050278023537,15.766256178071274 -16.46733059928394,22.977303374412685 -13.151326804294158,29.16040489547069 -10.919311743262185,26.62294067996997 -8.94659811086558,36.166211605873514 -4.3872231279390945,33.13915457925333 0.8911263081806453,32.26173028306016 0.8029729706721724,35.93882986799744 -3.82760571698158,36.93208597250171 -10.856214384647672,42.29244672777429 -6.727441391943529,52.145146287147384 -8.257812808713041,59.57119462002899 -9.120160317606121,73.55286030135534 -11.346813500801872,88.90722007344758 -21.622712609573853,99.30122280038174 -22.285501698330364,100 -23.569074264168094,99.45179246178424 -23.55481827617662,98.47742490607502 z"
        });

        shapesAlt = [];
        shapesAlt.push({
            d: "M 38.05885794720393,-30.631002101199343 C 30.390255282067585,-34.60416259473314 23.08427397143555,-39.61012577680937 15.594922205838046,-44.03734165992614 -5.135384039651626,-56.29191380754657 11.929321691838112,-45.96016927454204 -12.240712857918723,-58.43679550735352 -17.696812828074542,-61.253164741699734 -22.867357273292384,-64.62436775813869 -28.356112255976313,-67.37432172085086 -34.10861926292563,-70.25630241113812 -40.13210861629886,-72.54677522833956 -45.93656221240824,-75.31883412260918 -50.878521569929404,-77.67893747421668 -55.67318170170846,-80.34680175928126 -60.587007509974654,-82.76678938001722 -66.09193928348019,-85.47795923554214 -71.70056328138264,-87.96918502207015 -77.1907249415293,-90.71130178177555 -80.98101736490575,-92.60438821575048 -84.54664330208894,-94.96539586001258 -88.42274305069306,-96.66969110694238 -91.54245223218486,-98.04140258704565 -94.89215317883608,-98.81065420524594 -98.18960610544237,-99.64883301912094 -98.66335497950381,-99.76930489610922 -100,-100 -99.65466068289517,-99.64883301912094 -96.680241187913,-96.6245769511728 -92.80303619273099,-94.6233722826414 -89.39937911768716,-92.20087273786484 -87.39908376565849,-90.77711419163987 -85.6097900330421,-89.04790568207517 -83.5392612848376,-87.73205939263536 -78.18876260134952,-84.33191901124842 -78.03885097460518,-85.27549815786796 -72.79566168613253,-82.76678938001722 -71.60812447668772,-82.19859216202835 -70.6222445292241,-81.20266451840226 -69.37723449772984,-80.78066127957763 -68.13212398927399,-80.35865804075301 -66.7231355564079,-80.68209338022359 -65.47048927583013,-80.28410413522732 -62.299938751756116,-79.27672211797599 -58.79459899154789,-77.21212151050734 -55.70352574411919,-75.8153912669595 -54.70568903822222,-75.36445066318689 -51.796780522219464,-74.82227697825887 -52.77341658921358,-74.32571983390858 -53.35588153575318,-74.02971470496159 -54.07569848883402,-74.32571983390858 -54.726789200163445,-74.32571983390858 -58.6336348990248,-74.32571983390858 -62.540380120924524,-74.32571983390858 -66.44712534282424,-74.32571983390858 -67.09831653111527,-74.32571983390858 -68.40049795377412,-73.66367713376205 -68.40049795377412,-74.32571983390858 -68.40049795377412,-74.82227697825887 -67.42386188677999,-74.32571983390858 -66.93544337632132,-74.32571983390858 -65.9588073093272,-74.32571983390858 -64.98207076537145,-74.32571983390858 -64.00543469837733,-74.32571983390858 -61.27406897356579,-74.32571983390858 -59.80549770245611,-73.07086306017507 -57.168580321571994,-72.33959173346898 -52.13016308089092,-70.94245958207463 -46.604533053290645,-70.88659439141118 -41.541498957011456,-69.85700696564072 -40.90296786588517,-69.7270902542597 -40.20585870613152,-70.06630047670542 -39.5881263460616,-69.85700696564072 -38.24123267547969,-69.40043965201716 -36.54588892106104,-68.06208652317335 -35.19296663278165,-67.37432172085086 -34.54187592145223,-67.04325013229675 -33.93027265604141,-66.61531875273627 -33.23959402183178,-66.38120743215023 -33.0759170513448,-66.3257441493333 -31.837739453241042,-66.50971746606851 -31.774539444378973,-66.38120743215023 -30.537065185006597,-63.864761928254374 -38.504281361013696,-43.19293327443039 -39.099808312564534,-41.55465641513626 -48.03723404910022,-16.965532458441928 -38.654795849527815,-41.82815470467926 -48.86667136731385,-14.7420777746443 -50.323888741759916,-10.8770304918189 -59.665332340989366,13.672304588071938 -61.07532554347172,17.035971832389023 -67.93207435867878,33.392616415308055 -66.55835333934303,26.714917545716574 -70.84228907518265,41.36596570505273 -71.60732066099473,43.98248626272698 -72.05806031084407,46.68581891524519 -72.79566168613253,49.31047810681105 -73.12884329088072,50.49630720790822 -74.23187937559898,51.88108069302274 -73.77229775312664,53.28273430769025 -73.7208535487747,53.439779798709964 -73.42957083702409,53.356785828407794 -73.28397971962958,53.28273430769025 -71.91960305772494,52.58904136463184 -73.00405090454258,47.00001037424627 -72.79566168613253,45.83477905028218 -71.88785233785147,40.75828104114527 -69.3229769384524,33.61446954657583 -67.91217992027704,28.952740435026527 -64.22457495168125,16.767195960042415 -64.47345638562615,18.923431556512966 -59.610270966018916,6.112217041490524 -57.607061782103095,0.8351670169502796 -56.001841843183534,-4.6042537775758205 -53.75015313316932,-9.776707285064518 -51.59904186174163,-14.718164257777573 -48.73554893239335,-19.30965997315107 -46.424980722866934,-24.17616113249194 -44.17590441385495,-28.913047011336644 -42.67196525225331,-34.02541529577367 -40.07644437955865,-38.57551450295769 -34.76151855956428,-47.89284363139716 -27.553703240439773,-53.017972489960535 -19.56588526822111,-59.42980931909251 -18.387993847092304,-60.37539800494454 -17.381415645533963,-61.540428374985346 -16.14755855678007,-62.40905170823271 -13.821918803009922,-64.04602236702573 -10.80127990568026,-64.42110286477151 -11.752394824421657,-65.38819362041124 -12.19620156391889,-65.83943565506874 -13.076882132561224,-63.19136533144424 -13.217449401874475,-62.90550837562136 -13.81669400100543,-61.68692378503447 -12.954199762417204,-59.27829006096215 -13.217449401874475,-57.94023836300322 -13.84603327379989,-54.744468121561354 -14.425282957567504,-51.29439069024685 -15.170822012824331,-48.0095978608053 -18.417634550771652,-33.704391403382076 -13.078992148755347,-59.81513846692404 -17.612512657271253,-39.07207164730799 -20.23928186503126,-27.053519882544464 -22.686197311482687,-15.015777018110555 -24.449367034076587,-2.8253091720068113 -27.25810001933931,16.593873201239433 -29.89843361691868,35.93096589683813 -33.23959402183178,55.26886240812979 -34.44913568587245,62.26899184757559 -37.46213431504013,79.3180231730519 -38.123071768608796,87.04681153820155 -38.36280979904581,89.84991781361327 -38.123071768608796,92.67422472792785 -38.123071768608796,95.48788108431017 -38.123071768608796,96.8119664846032 -38.70543623818676,98.27581533851654 -38.123071768608796,99.46013728518935 -37.85761163599578,100 -35.776134918052634,97.85953928650451 -35.681385143240334,97.47400918474978 -35.163325929102314,95.36730873036029 -35.889975315573636,92.64367973159383 -35.681385143240334,90.52261107169201 -35.36659082246949,87.32231936697704 -34.834565310665596,83.73478945215962 -34.21633056578753,80.59197056949412 -33.82145610660163,78.5844408762284 -33.06938604883919,76.6550822591069 -32.75127598833471,74.63358626817532 -32.4159843673924,72.5026708660343 -32.573934151066766,70.31337834918915 -32.262957954837674,68.17864482250633 -31.55650443765292,63.33012903929628 -30.542691894857583,58.52381357996873 -29.33284879993205,53.77929145204055 -28.816095786295136,51.75267113606611 -27.914817440519712,49.842403141653335 -27.37947618898218,47.82090715072178 -24.887948971569315,38.41164160239552 -27.001984244157413,43.56239208617322 -24.449367034076587,34.91102425938365 -23.696593637582765,32.359813726765594 -21.519358356132614,27.281808563204308 -21.519358356132614,24.483927089797078 -21.519358356132614,24.11346853228605 -22.087656051083087,24.81781203327664 -22.007676389629665,24.980484234147383 -21.844903711797315,25.311455345739816 -21.33387788497302,25.271666468936374 -21.030939845673913,25.476940901536054 -20.353725124322025,25.936020139200266 -19.805522821696513,26.596455207960815 -19.077567234724057,26.966612334586955 -14.34178660245719,29.374140812081436 -9.366368416714934,30.586998215855715 -4.427222414119257,32.428439491555395 -1.758152405515176,33.423462842526874 0.7413124918660827,34.84470946471123 3.38636850664183,35.90413854808426 15.523483086122752,40.76561585934388 8.326921186700247,36.76150846162963 20.966822482152224,43.35209380549233 24.27291642745824,45.075977036090876 27.39252513198842,47.161275897654235 30.733685536901532,48.81392096246077 33.42486047706308,50.145140227029174 36.339094272031986,50.96965417412321 39.03559449115966,52.28962001898964 43.63703742573401,54.5423134986201 48.75473098913713,57.5140201156384 52.709303244770325,60.73068956509826 53.69176707601565,61.52988331786281 54.65755163115432,62.220260521187555 55.63931202319128,62.220260521187555 56.12773053364998,62.220260521187555 57.4497059177489,62.571427502066626 57.104366600644084,62.220260521187555 55.7619943933353,60.85548195143639 53.77184721443072,60.354202389889736 52.22088473431165,59.24111860900899 50.517800234769425,58.01881637084193 49.09323787285149,56.41138593876667 47.33750344541784,55.26886240812979 42.67587481083015,52.23536245971218 37.420226379116,50.24099524841935 32.68705814785139,47.324350006371475 14.196584330904187,34.79075333631866 33.087659793849895,47.27079578582541 16.083340716296732,36.89715235982325 10.277982827532739,33.35564089343006 4.361396942249925,29.677179328342135 -1.0087952257165966,25.476940901536054 -4.192709185686724,22.986719884624307 -8.006412741121778,18.85862391626489 -10.287340246968853,16.53941468803872 -10.517532966051519,16.30530336745271 -10.955210610889623,16.644111682051914 -11.264076790924591,16.53941468803872 -12.431518608044428,16.14373641315983 -14.187253035478093,15.303347106129081 -15.170822012824331,14.55328658759916 -15.723344824799696,14.1319866875059 -16.061248846744263,13.453164334768019 -16.63587659027712,13.06371563150988 -17.064209877684107,12.773337212413878 -18.100931167729925,13.090542980263734 -18.100931167729925,12.567158487159574 -18.100931167729925,12.401672931363336 -17.775285335103604,12.567158487159574 -17.612512657271253,12.567158487159574 -16.47310391244477,12.567158487159574 -15.31520740667932,12.359874515327391 -14.194085468868579,12.567158487159574 -13.02815080617313,12.782681569844982 -11.950334438822736,13.401016791684711 -10.775658280465919,13.560272775860184 -7.71000570432831,13.975845489140795 -4.5899950919516215,13.560272775860184 -1.4971132592136627,13.560272775860184 10.996594057074077,13.560272775860184 23.606955125808327,14.850999824893748 36.10548533625405,14.056729443248855 38.4030920177309,13.910736418007858 40.64613970904534,13.230507387807222 42.9423397130594,13.06371563150988 46.514396175786544,12.80428411659436 50.13237060997628,13.515359574013843 53.685939412241424,13.06371563150988 55.017962492502846,12.894411951171918 56.26598683284584,12.278186745526341 57.592684634141165,12.070601342809255 59.787402906914025,11.727372041898576 62.00673803528505,12.309334603630063 63.45290291380928,11.57414467542057 65.05450571225342,10.759879378412322 69.45911427900455,-0.14307668142984653 70.2897573207577,-1.8321948833061867 73.31331004997446,-7.980681596019281 77.04693336651752,-13.794881457406277 79.56830224153299,-20.203904931612755 84.14623356708711,-31.840543765240014 88.51698139777068,-44.53711406704844 90.31190184023805,-56.94712407430263 91.4096126459902,-64.53695280152502 91.5161182253126,-72.17008709920778 92.2652744511879,-79.78754699087703 92.37981818744032,-80.95207497610971 92.4507549223475,-82.13418642962678 92.75359248468496,-83.26334652436752 92.9452020505037,-83.97743629063574 93.45994552490808,-84.56221220729272 93.73032902864071,-85.24947462480709 93.79081615953893,-85.4031038991316 93.73032902864071,-85.91151732495362 93.73032902864071,-85.74593129219578 93.73032902864071,-79.44220767377222 91.87713194843087,-73.42203004105414 90.31190184023805,-67.37432172085086 89.76128809053355,-65.24702348932828 88.4767906131207,-59.63649042915496 87.87021119579111,-57.94023836300322 85.77717560818263,-52.08815868708363 82.8013494357377,-46.553988117745234 81.0333568189858,-40.56164260339726 79.96619100956764,-36.94487389274704 78.93318736710194,-33.50996848263786 78.10324766408019,-30.134444956849038 77.85617481544455,-29.129675340599945 76.90264844962417,-28.95514685825748 76.63819308662738,-28.148316856409465 76.53530467792348,-27.83432635133161 76.78378420402191,-27.451408650579083 76.63819308662738,-27.155303044670475 76.42307191178844,-26.71782635375564 74.42116892837376,-26.687381834383274 74.19650244218045,-26.658745900320184 64.96889934094898,-25.48597880423425 79.70685997161377,-27.01322862093288 68.8247027433049,-25.169174944230903 67.86122915828363,-25.005899881590423 66.85997623569142,-25.32019181755315 65.89459358839929,-25.169174944230903 63.396937246184194,-24.77852051743325 60.96680148246722,-23.99560403245195 58.56942117809689,-23.183046843791317 53.85574547738753,-21.58556363091688 49.38120484486848,-19.0605775852829 44.4073942905122,-18.21777683117317 41.555757642635655,-17.734482645757367 38.533712067843254,-17.721219686822863 35.617167302757,-17.721219686822863 35.331712254780655,-17.721219686822863 32.594518866194875,-18.123629918130618 32.68705814785139,-18.21777683117317 34.73789341157743,-20.30297521577492 37.80676125048703,-21.661423736943703 40.01223055815379,-23.679603988141622 46.23617546904717,-29.375040080887985 50.950253077603065,-36.488105625200184 54.66267595619718,-44.03734165992614 55.130597166484364,-44.989059440437295 58.39097409425108,-51.17020116567845 57.104366600644084,-52.478411206034764 55.91270983577269,-53.68996240930793 47.63270475867179,-55.54567141355839 46.36076690146206,-55.95411026256364 44.83200993033907,-56.44494022010134 43.4276434377077,-57.27126275250458 41.965603169103645,-57.94023836300322 38.3750589454375,-59.583036685570505 33.6907225175226,-62.47908415048526 29.7570494699074,-63.402065519971664 28.80533168939624,-63.62532532870224 27.79764824126005,-63.29244515483891 26.826940315001792,-63.402065519971664 25.600317567484907,-63.54062325005243 25.367612924361623,-64.39507933171066 24.385149193593264,-64.39507933171066"
        });
        shapesAlt.push({
            d: "M 69.14189658942513,68.84554314716266 C 78.70564420918595,23.900200692021727 11.125040869478497,100 49.9702974571982,56.389174911944764 100.05432271057742,38.647924494753596 62.63452556222231,-72.81500935025696 26.163232446129342,-32.562367422810254 14.232550171267562,-15.702090331414894 21.21950275680227,85.37353486829815 17.244822871120164,51.20556947973549 13.717901770049124,21.630201913182063 27.733670881304676,-57.20570712095582 -22.94007980255668,-17.07479502696556 -29.90030743734522,6.692962679378667 -28.530228893023946,71.34327558143568 -32.61366233549961,64.8889141891955 -40.12878027710992,35.96342636422568 -26.729461547082693,-51.45605796317412 -71.40770897424618,5.989076910160065 -91.54194701152873,28.546634614233454 -100,36.30876525089053 -77.84224292470445,6.168813789889185 -63.131625094049035,-28.26142686674747 -26.36620304026438,-36.9543736347393 7.314495435633333,-39.82854167582279 34.33998601806189,-64.40947166239931 -76.50367819513585,-38.66044505693845 -16.014532811944477,-65.04198790997214 16.17906891044001,-80.22732119521083 57.9650741968824,-100 43.76145803298337,-61.4240783927769 70.12168271721382,-64.30627936703269 129.6779264960354,-63.763052261259105 73.69602901989796,-45.88854011712482 49.17472811417704,-36.373067336139556 161.6850714811331,-10.330838669891477 97.22317720581063,-9.992451360010335 72.29235118778888,-10.02249761966425 146.36286937299795,58.86067672982071 91.62383658604048,29.65641522787695 78.39081502062729,15.347135096865955 85.99738481681399,82.34995427021073 69.14189658942513,68.84554314716266 z"
        });
        shapesAlt.push({
            d: "M -17.8365489277339,95.89630259573207 C 39.725798920824786,75.355522251868 -52.2034655983198,88.90659446952995 -65.50964096502264,66.91605967706198 -86.06119463699662,61.80763063872453 -100,2.7617538124830077 -78.62226491041714,42.77094653529866 -62.76530290167127,64.4134960419413 -62.770054414519144,16.99912872769515 -63.96646595565292,5.23409200771296 -70.17349324921551,-5.498906424772613 -94.89066914391799,-34.70975286799862 -67.78687622454478,-19.769251020969207 -72.2633831450264,-41.5059677546823 -93.68834245413696,-100 -70.2597962376746,-50.26940592998497 -63.41635713146332,-40.24381079087962 -56.70198462934075,9.322914267677945 -50.34581801414892,-26.32633875086607 -62.174563794150956,12.38007642178114 -58.9149290109436,53.37709896867929 -11.300988460126788,61.74589975956374 14.43281724469469,53.59489280247624 26.89593847469645,67.12234321340935 55.3044580342021,68.41313531484349 48.570206753839074,48.61016794658525 19.826754023392,27.790590162138074 6.324215115532013,38.75960302564701 45.04788118890605,67.47863879823572 -60.938782575135775,14.256633087693075 -48.07604941767312,19.73561224940012 -27.966386440539992,18.623176425126587 43.02460944261347,32.52687877484669 -9.353159101498733,10.07636844782138 -23.06360093886019,-0.8849838133411652 -22.741273822412722,25.90773046897918 -26.62413254587524,6.458333838383595 -44.180196761116704,0.8915001738181161 1.0063025423988137,-34.525995381335576 -34.081486505946,-48.64351580920444 -57.73674776400103,-71.22212304381911 3.6764588235351567,-34.75212860502856 -5.316506513209035,-12.356503099877287 6.909814831604933,6.897897261625573 71.79996518789557,43.079891840052454 76.0491752488847,9.123641637022246 69.94008730177586,-6.374445394208308 12.138515326780478,-22.629564785665522 57.3171600886497,-11.167364282490055 102.44373214849341,14.105263464114671 40.031447257480124,-31.18471215286685 26.96876268181201,-30.630627573029017 11.557570153905289,-58.06945063299363 -35.28507380117635,-65.09829570991721 -56.63973011407018,-98.03849792072826 -32.83571741298563,-80.15108841159349 23.01851005163155,-58.163317254149185 23.796206644263407,-39.02771441080514 52.01369599335956,-37.85952103780799 117.11116746125208,4.235401582835593 73.52272798898042,29.157668287191143 107.06491778670636,26.865111822976104 103.96353747222409,67.15374198606446 111.81390942355898,74.21095068559967 102.16950197842323,56.243260003267864 42.97156704408863,86.86073849176316 86.8367578973295,77.17841591349531 81.00878496543743,94.1988585702504 10.068892087809772,100 46.87081363839326,88.34325898508658 27.069902026714104,90.22667140525022 -7.710881109875885,96.08606250372728 -17.8365489277339,95.89630259573207 z"
        });
        shapesAlt.push({
            d: "M 36.68812478149255,78.87084448821139 C 21.30467448043585,51.29568160040051 32.433570022087025,-29.316380266232017 -17.25063581826811,3.212239707073678 -31.958250708766357,8.359996212608962 -62.27363795863099,-18.839844570897554 -35.33516715166891,9.708102225822586 -21.387551916862392,30.172360201058666 -22.358049131921362,26.164124973122654 -35.26674022923102,21.417365883449378 -48.50287197444533,54.367528738655324 8.210526425616706,27.890187570627774 -21.78663650897137,48.3371692695126 -0.610634204540446,43.016363076902195 17.704740177237113,39.75360743344177 -11.764135615378365,54.12753022022429 -39.028047299957954,78.1953481691364 -82.2057831443883,15.79383794261544 -86.48989972543151,53.9249274061649 -90.96373364416135,100 -100,20.558073285668684 -91.3812509015268,8.825768796471294 -75.13929052149744,-10.723298654128513 -42.33062445609508,-40.98651798345596 -26.370631686568785,-47.28136011506853 -59.890085669289626,-5.994615748921376 -14.823349422209787,-51.019191621553716 0.8692827545636135,-59.86547980010294 -30.87741834177126,-9.092703351206339 28.95457834800027,-68.35485245564402 44.78502078152593,-81.44569654216242 60.59042261319382,-98.9842036406079 83.03697462230645,-100 54.44686745113893,-81.74348842189517 39.622135579034875,-67.42443759286432 1.5551170165584125,-33.73048191594687 47.17657215201632,-44.689049197044426 87.17023896646313,-27.092896546405413 82.60963240657316,-68.86357662741526 85.08508718259415,-70.64658920484001 92.26539281879019,-48.014058559012476 100.51514082599735,-21.534143773571728 65.7344404177573,-37.99494858025437 17.696219416882684,-49.704733917086564 110.17255322236471,12.48456590334277 53.73477533580714,-8.814561388209256 49.379014810559624,-3.7767835538195698 97.18056734526414,94.15268037471523 60.629722446665056,42.76999137751221 47.85701572888891,25.608884405539172 29.17968292511793,1.763971286428756 37.420301546231116,38.50975031476818 37.91728793588146,50.40134954932569 40.42447819689582,75.80334467666802 36.68812478149255,78.87084448821139 z"
        });
        shapesAlt.push({
            d: "M -0.5725121531397832,-77.47701466794425 C -8.967370553087036,-77.01174794449133 -21.867246821620526,-64.69788735800796 -34.42711235502655,-56.16729931314756 -55.31393119006424,-25.901038428445645 -68.55437818926907,-53.68316488022422 -79.66366838404272,-74.02924003199674 -84.7628337917196,-63.8397699056284 -55.04988265829853,-18.210846457993952 -45.51819786152106,4.438693678289113 -41.804441452574636,-0.9377387980853769 -27.354913165449318,-28.526380023109454 -24.748420672809033,11.29267826367068 -14.567648520955672,14.273736245240329 26.248068118077043,66.18554065245846 7.943092949956537,57.94146701352773 -18.09307662413711,29.962391611118562 -42.715561935430635,27.229835679731025 -73.01734612779232,10.420383708914471 -77.51156813291871,25.76685537651909 -52.33077886382528,63.83979407114384 -40.03496186218496,83.6128081903698 -44.63027627346327,74.66980340426866 -55.43475876713824,45.363799550432816 -60.14010682527193,28.406937935585916 -44.34286774346325,29.836328172371367 -6.419439127247912,57.79132666625557 17.829527513023294,68.9493989814799 50.61890986218444,100 15.86825428195813,47.44179222095144 5.367693420483292,34.804033176191666 -23.689004477024227,8.48263157951969 33.30399586060827,32.44845928527508 9.853940805522797,13.992771852684285 -22.304078788602055,21.639224240235166 -11.664564280250872,-6.35669452641811 -31.93476164686217,-16.414059835185512 -77.95621361655104,-32.4323328313216 -30.646900778689442,-46.24775799396254 -13.283573261324406,-64.64134005193733 10.951216308790805,-100 -13.39320414958955,-21.655479576937537 5.243079912660974,-50.72562800032493 16.92307902981416,-44.21036338934079 45.54060734948234,12.219023021237987 55.21502979064326,7.014173759480386 35.1406555838511,-13.860650924739744 20.892587143567184,-38.94083109798956 8.607725175581578,-62.148989343772925 7.876637782565837,-73.78637660207798 4.464386454278085,-77.75612637098517 -0.5725121531397832,-77.47701466794425 z M -97.98250166973642,-61.60897062597022 C -99.19851040540915,-62.2170555455246 -83.32844934841515,-15.093494969484794 -98.4394715662303,-36.809915948712536 -100,-21.87023045725705 -93.72445730193067,7.19380409073041 -82.82065131783216,24.169917566191046 -79.10955311558138,31.385821020768276 -91.85340199508079,-5.17612854668711 -90.006995513954,-12.924801064442619 -70.05489559309203,-4.150705175919086 -83.60707774114778,-20.640769584670096 -91.8762786830068,-47.319418050890846 -95.9517123059947,-57.534664727034965 -97.64209010925995,-61.43868429401392 -97.98250166973642,-61.60897062597022 z"
        });
        shapesAlt.push({
            d: "M 31.351623587816846,94.3129832307242 C 3.649947075815902,77.47920931273552 -41.113712491488066,57.175319261683256 -21.466541309099952,32.549058938604475 -37.2611883636889,1.0257867274744399 -56.62123955582567,65.66955499772328 -50.31466605493201,14.838585509694084 -26.163617482846036,-15.866731811227979 -1.7717168893461945,60.54754308542985 2.338467184674059,19.529474150681466 -7.7945873956909395,4.803607941116496 -19.2773552785726,-37.77170599190052 -12.929316073072172,2.5533685089953053 -12.261154886366128,35.26584757585624 -22.651130603070584,-27.355502524397963 -25.616713467963876,0.07909421539108052 -30.00598297477272,-24.212789990382092 -44.615856032920576,-40.7264837622748 -38.08560784036123,-39.77083318037658 -16.943731916185158,-85.63245658302922 -77.08331803765999,-43.66075955843365 -75.62481498007222,-44.592860575354656 -60.94697141281365,-44.86492731426769 -100,-31.069592150625212 -73.16328515692614,-52.63591435180215 -64.31806855149073,-78.38694807380952 -24.71065549937053,-100 -9.652601896774328,-60.49528152142747 2.4675742114901595,-42.857673217093605 15.622915315164093,24.151376418970983 32.36305431577878,11.515695715793868 58.57215016440139,-22.170811828771036 12.51474214311483,-55.14094160672954 31.927433539318173,-88.08216544806903 38.39737637528887,-97.00671176454536 29.32830037571722,-38.436911939079955 47.10092618592034,-24.360090210533556 45.278836315331716,40.858915433558366 97.38348633393352,-99.56613389700831 115.1502940163189,-31.896689813118485 126.7134074738284,-15.868024728520822 128.33915861837198,62.17461485263675 120.00298202138487,7.426937128341123 113.61966464403616,-20.746755781914587 97.03753860685674,-58.92854281617982 76.2832700519582,-15.787402100187151 56.681258623585194,2.735669847289387 51.28739238021964,22.800831955337486 80.85197800876975,22.870464786681822 85.19303093567828,47.90309825003183 55.23688530498376,43.88360308898257 68.49630625073343,73.7980521369822 60.227730757915964,87.21725918988295 48.85994016286415,100 31.351623587816846,94.3129832307242 z"
        });
        shapesAlt.push({
            d: "M -69.59923680601557,97.52791086511613 C -70.4504759371514,90.98432890489323 -69.0323738995986,80.515693703489 -79.6307262294213,84.37848650211558 -94.10670427058842,92.00931151684597 -93.6356411953559,70.66834059708313 -96.03347128949918,61.787299470593496 -96.75130868332509,51.62713178952251 -90.74823050437062,69.988199586534 -86.52217305988201,70.6225191788144 -77.4798594081735,75.66211939950549 -68.14891805994802,67.55550745198923 -73.53487148811669,58.0302262261051 -73.13494970763946,47.71114835484386 -69.91063349594059,29.21800185020274 -86.36921455230048,34.49540103179254 -97.32941437071909,32.741999585094106 -92.42019264684717,14.508570768742985 -97.87804318697972,6.303608106963395 -100,2.1025871075081426 -98.60636754457428,-5.967462182544253 -95.2825668927991,2.5043039538555405 -91.60967316782218,10.112832360933538 -83.55492917624288,29.905417601384244 -74.3775131985052,16.054878300297105 -72.23033098614926,6.133360280736213 -75.67288941681883,-3.9669085086481317 -73.15025500611274,-13.953993671051222 -79.25744700554584,-22.055692806711903 -92.74406032071323,-25.334801986945195 -92.32401490705831,-37.64281284252101 -94.38777379502001,-41.918848699925434 -91.49242702334496,-55.61265040738831 -89.8409664226505,-44.20141666976394 -91.63650467872583,-31.218272092645662 -69.92518297720528,-30.80861916560842 -74.44232452413891,-44.50960113655257 -72.94552301974525,-55.8423243616382 -71.70078655440481,-68.42998758437966 -83.35775536196097,-74.83364888386868 -89.08316519392213,-78.38702901274269 -86.10004914890344,-100 -82.51067322547203,-86.0908848652498 -82.86789133366584,-79.25555746252437 -74.06554964567391,-75.64312911423193 -73.89086139334648,-84.04819438197669 -65.19291695728633,-91.48260139963365 -52.33164790504763,-89.95311080096992 -43.06126641065752,-84.74930932006325 -43.31248115535134,-76.16983923144426 -32.62418657771052,-74.48172149613488 -31.228003239205933,-83.56371555129242 -32.005172283903406,-90.16832975110619 -26.809023452233333,-92.72469250474401 -27.428037746040474,-84.6411329820887 -25.04626876757905,-73.43954404268749 -34.84647812516674,-68.14598926826484 -41.906661147437504,-63.3026181186882 -41.05032025014373,-54.359694429904934 -31.214587483754002,-44.893367324196774 -40.537781705591804,-36.299158800010936 -41.2452266128001,-22.60999025203651 -18.340564016120908,-32.17645935879227 -19.013713717491,-42.956774681574686 -13.81954890599333,-55.29615195130556 -13.095948405952342,-32.65186838297386 -16.749001929204482,-28.60201082522977 -21.05980537820264,-18.926326131837683 -34.38344560777526,-20.65563590501334 -39.7005251928142,-12.708123479898063 -36.27478369503506,-3.0750442025522773 -34.031234788588165,7.3951971104201135 -36.936974046881055,17.8886798025556 -33.75744000478883,28.920398824333887 -14.746086326531724,22.245777055577648 -12.624979807870858,12.147492286365761 -10.018260732713003,4.584218434650026 -4.161244229312018,5.23658316278474 -7.667196828349191,13.456662168735463 -10.630661625945407,21.30251717930001 -11.66934342480306,33.808268712064205 -19.42553961900279,37.500624730161434 -26.148061303351156,37.152287474168276 -40.99958602001947,32.59319807215974 -33.79438057085696,44.26282681795911 -28.884308552625413,52.404395311371076 -45.01240853454431,66.86676902069274 -34.37475370987691,70.90037648010977 -23.529060198554333,75.36385503357917 -14.924742619204153,68.50736474901416 -12.308197920334948,58.63195120126656 -8.800450255427478,67.93643932510133 -10.02251220451113,80.04774837424188 -17.193327970684194,87.40062161052592 -21.389908544039216,83.16351033936215 -37.608895545287126,79.62789229279775 -27.962400512489538,88.47718874696258 -20.61755783404638,99.43502663660453 -33.52181399002163,99.5935592960991 -40.83311727983495,96.5530011432302 -50.30123945141347,94.99280547046891 -60.842811013443274,100 -69.59923680601557,97.52791086511613 z"
        });
        shapesAlt.push({
            d: "M -44.66009606322289,81.51277162185363 C -44.921587629240534,72.45060455914418 -43.53741646225002,63.546272982704636 -40.81463185708043,55.064404103951915 -38.17933768595131,45.53206168518443 -45.45191878205195,36.9561371607619 -42.3427262576716,27.927868967232698 -38.201479721889875,18.507804305923514 -45.9954763722603,10.150361422444163 -47.416485616741625,1.1425697134775987 -49.51312087817975,-7.137082123385781 -62.146328064448056,1.428064814030435 -67.38634864027782,4.03788584646918 -75.89702225034088,9.074611180827773 -84.833391197364,13.87237887954862 -94.46155180705145,16.2969318148201 -100,9.003286392494743 -82.54688307907224,7.359485158083061 -78.87982881737283,2.4819669405393086 -84.69769774703258,-2.447869184930056 -95.91841939291989,-2.1745228120603315 -97.66215370988608,-11.262456934291208 -97.85359414450521,-12.986498555577526 -98.3442459851259,-22.458881124812308 -97.29573240718612,-19.827701845317776 -95.20958032205523,-14.293270570393489 -93.55363035996048,-6.616156437167717 -86.35952612574826,-6.1858563405211555 -77.57472235393278,-3.634819474290964 -70.10736972046116,-9.057658807029327 -64.96081596890289,-15.660198381962886 -56.25664447840351,-24.33292034354075 -47.729903196243484,-34.07776752315213 -45.32445511498978,-46.533054633029245 -42.182833325584404,-59.250130168963395 -38.26163551864333,-71.76126223673862 -33.523533748624175,-83.97249708323992 -34.16016626866276,-78.59374587515794 -34.796994735922,-73.21499466707596 -35.433725229570896,-67.83624345899399 -27.14261048029678,-67.1056542466321 -18.753228199844102,-66.74618907026685 -10.678635129438263,-64.61594886047948 -2.2851379573510116,-69.2851751824243 -9.5295026536715,-79.74699324255926 -7.210075402302991,-86.80893107641259 -4.650808752803556,-83.85198954251237 -5.789556025873523,-71.30196195142918 2.7354217313002636,-69.5703763621461 5.670417176482559,-69.10216047829502 17.81738133459592,-65.00010338665233 11.145182522705241,-62.59867222342288 7.109845459709163,-62.73769677650608 2.9546866712581163,-66.7354119731286 -0.47056872010348627,-66.8449464694972 -4.117734338902437,-61.28925492112751 -7.382215035683686,-55.52233226884844 -9.111351284708093,-49.08497326175259 -12.395132782727757,-42.344682790670326 -15.46513586296912,-35.201034965787116 -20.566131885715706,-29.63299874251362 -28.66267104483947,-28.75878021738218 -18.87481345028546,-40.6741347606338 -17.483392236129248,-44.57652163438814 -13.316182693605356,-50.47904270259657 -7.970056697769181,-61.76736613962369 -19.567780796273894,-62.27398767873101 -28.265779949321484,-66.5090929332257 -38.26614230471931,-62.29848108131789 -39.912392879389635,-52.47006241208002 -45.55302754793067,-39.148979568353056 -48.782237744986844,-24.2961802396604 -58.09472738213435,-12.875200534222671 -64.58626285654412,-11.847849256117982 -67.85103747415647,-6.209957848666676 -68.64011693189582,-0.014400651116957874 -66.928615932734,0.1254076908490589 -62.85849823806459,-2.7051478857028 -60.22046080584576,-3.6464783339223175 -51.573114009347954,-6.533956578086091 -42.835729464940606,-8.899823320759396 -34.798464340077174,-13.459515146335605 -29.73126921290047,-12.606165000208222 -28.87664540983856,-27.84586211616346 -26.841439602088414,-18.852766448749037 -31.88384740584705,-12.323021266303726 -24.472437703883998,-1.1969421280121963 -17.967087950415234,-2.0535254032810712 -14.615312766814242,-10.632192698925252 -9.078040257189926,-18.53758534426089 -8.050884926305912,-28.078451467128602 0.027627088513867193,-31.285715575466895 9.972830301286152,-31.470003936530688 17.264418277794107,-37.83015679946433 22.814035462322252,-40.15683409799858 37.01305688916557,-42.84826714785688 33.589662996400534,-50.88200816195615 30.11767419290308,-51.37697084143211 15.388615534079463,-53.49692382213298 21.05070642328657,-57.914553912705216 29.487116036706084,-58.32604307616505 37.06850995262229,-53.63869163630592 44.85349303084075,-50.93119091435064 40.59928292232823,-47.301559632595634 36.82788676560867,-42.64663745776156 31.46118631159942,-40.7573143558189 26.364501127708138,-34.352583500177104 15.683418127615269,-34.85175904489799 9.925900941929626,-28.319858443025055 1.471660131426873,-28.290662307141474 -0.9676868190071559,-21.600240403726133 -4.344249326025974,-15.327871895663918 -11.90820393930035,-11.481917821469793 -13.315888772774272,-1.4838088591098995 -16.52325085472299,5.7070622459608416 -20.407806531394,14.533798723005106 -15.61630914373545,21.574770204244075 -12.692580663743087,29.26442495959435 -12.451075714236211,32.570642414383684 -11.74919276970627,35.330069149823174 -7.815552314250965,34.25314322488259 1.4394268136224753,34.586841341726455 11.01909048618792,34.30947805083247 19.670846095151376,38.065590324337876 22.361593329737218,39.33895382789339 35.38747874627862,38.1210433877946 31.00884215262471,42.03802881935877 18.14853213757071,42.117289470129975 5.308796580689659,40.17221938389949 -7.587273802141155,40.27381801782994 -16.299479128689043,40.46653210938365 -25.34312917904289,39.10685434497995 -33.780714475786496,41.67082372777605 -39.88878123929589,48.0542942903777 -35.375137010583046,59.143534880905236 -40.32358812201845,66.77401357560555 -43.2468267339591,77.63654370206211 -41.395321445610556,89.14530776237126 -43.85367527645192,100 -45.15182561355735,93.98961292600717 -44.54674059605068,87.6320073769426 -44.66009606322289,81.51277162185363 z M -7.108084873931148,-93.5635256946056 C -7.252595949193861,-100 -4.317208609570045,-91.39233251569294 -6.849630489834297,-91.12486455944406 L -7.038621584194786,-92.04277931479052 -7.108084873931148,-93.5635256946056 z"
        });
        shapesAlt.push({
            d: "M 56.44899843551002,98.60800001391999 C 51.833098481669026,83.464300165357 49.36879850631203,66.335700536643 36.66049863339504,55.41150064588501 26.72169873278301,46.216800537832 20.442498795574963,34.02010065979903 11.459598885403977,24.076900759230995 1.2985989870140315,18.658900813411023 -6.545700934543049,8.919200910808001 -18.14940081850594,6.858700931413011 -29.215500707844953,2.915200970848005 -39.628400603715995,9.84810090151899 -50.37120049628798,7.583600924164017 -60.108800398912024,4.8325009516750015 -70.25310029746902,3.317900966820986 -80.340600196594,4.554500954454994 -87.56970012430301,6.292400937075996 -100,-5.627498943725001 -86.23900013761003,-3.3212989667869834 -61.22800038772,-0.1926989980729985 -35.95900064041,0.07460099925398822 -10.906200890937939,2.8231009717689943 -1.4760009852400486,6.002000939980007 -3.5528009644719845,-12.791798872082012 5.456198945438032,-3.4833989651660033 13.239998867599965,-10.588098894118986 17.740398822595978,-21.13479878865199 21.38589878614094,-30.927098690728997 14.85269885147298,-46.933100530668995 -0.15360099846402875,-59.31640040683598 -1.3191009868089765,-77.49260022507397 -0.15100099849000514,-83.913300160867 -9.95180090048197,-98.42900001571 -4.861000951390039,-100 2.502698974972944,-88.828600111714 2.2692989773070167,-74.454800255452 10.50989889490097,-63.697400363025984 27.739698722603052,-34.186798658132005 57.410698425893,-14.405598855944007 89.02339810976599,-3.0240989697590095 102.68689797313101,1.5216009847840013 115.00679784993198,9.931100900689003 129.23189770768096,12.629600873703993 139.51629760483698,12.915500870844994 149.23569750764304,16.539500834605008 158.95539741044604,19.54800080452 148.02299751977,19.996700800032997 136.88359763116398,18.814900811851004 126.13249773867503,21.05350078946499 123.808297761917,24.169600758303986 122.41279777587204,30.55940069440598 118.67089781329105,23.265000767350003 115.03229784967704,10.939700890603007 101.56569798434293,12.205600877943994 92.25679807743197,10.043700899562992 76.55939823440605,-4.345398956545992 53.412798465872015,-3.790098962099009 33.52109866478901,-2.3600989763990015 24.662598753373956,-2.586198974138 4.333398956666045,1.133600988664 13.176398868236006,13.897200861027997 20.068898799311057,26.501100734988995 29.351498706485046,38.01640061983599 42.29259857707396,44.75750055242503 52.913298470867005,51.532900684671006 64.79299835206999,56.895400631046016 74.03719825962807,65.507500544925 67.66209832337898,69.38770030612304 52.93749847062497,65.328900546711 57.051398429486,78.061700219383 55.23439844765602,85.082300149177 66.57459833425398,98.48640001513601 57.047798429522004,100 L 56.44899843551002,98.60800001391999 z"
        });
        shapesAlt.push({
            d: "M 63.44336188779212,77.48942719222714 C 58.02875696558962,61.752967973699754 51.94020694569696,44.632419287333136 38.24881881135832,34.211282767501814 29.35099600784747,30.682360673841202 20.086675350242928,27.695167920708784 11.864525954973288,22.50236285256868 6.9116680016825285,19.77144014726855 1.9882873450139016,16.98751591840029 -2.9486317443052457,14.228076089006422 -12.408731580452283,22.275378066852866 -21.33987237069897,32.14816005570998 -33.938104081444266,34.93947761304699 -41.48774863781644,42.787063704984405 -38.75644186350497,56.67432741918745 -47.18800488722056,64.79805913029523 -49.33975152338454,67.27261577051019 -56.93980513749818,83.14426728103754 -56.78876999877947,75.14881461972519 -50.85701615277601,62.53925325721366 -43.447268733792995,49.68542323533697 -43.527635174420794,35.30405512208381 -46.11097936210447,25.160312445709735 -56.7296233710295,23.509295783110943 -65.51241750563702,22.74086970862541 -79.26794516487337,19.350788562572703 -92.0465068781791,10.761277157933876 -100,-0.8787983867123614 -91.08335781493231,1.1036698326931713 -85.9014026963632,12.266347596214544 -75.84454603208488,12.347962261129311 -66.47143782701167,12.648592279774064 -56.40844566027678,12.457421929367896 -48.358359182097956,18.124648243794738 -40.26650519893338,21.597592279049138 -30.868240473615856,25.29684897924946 -22.066242888440158,22.722338378827132 -9.615301643552769,15.226175432287306 0.6878296725371342,4.60282657797309 11.461637562052985,-5.074560301352847 18.468208536357224,-12.00777409448662 28.98363399847827,-20.2165770916114 24.063709962911915,-31.374165940732226 17.348071264715585,-52.121380939909905 7.943661435216271,-72.1060278771979 3.3934998403401266,-93.50433682806207 6.595771239836054,-100 10.423883093348877,-83.90549206155998 12.352101564899272,-80.41056007540502 17.51178068080928,-69.13362178100299 20.641367019904663,-56.63515199595936 27.82902653306678,-46.44388077942907 36.84629479911172,-43.7151664709443 43.79515940445856,-53.93860346717628 48.4047556788432,-60.38491377115399 50.36446780932539,-65.02725192875735 61.43890571748602,-76.78178003878992 56.12127822065281,-64.41811847673486 51.105913035762626,-52.237369781341684 42.22575740677448,-41.95228970878587 37.82672696786986,-29.52007278837496 40.44204490074955,-22.190979861778274 50.773789358186065,-19.019433983191377 50.12586493601586,-11.585586233745289 58.62771258881094,-14.242287602599419 69.02378860565085,-16.955351098871148 77.32832080385799,-11.948915518495156 74.53978774685334,-8.853703355916764 67.28021131131342,-10.775872740538219 62.62020597918729,-10.235391624296938 58.755127483330796,-10.722487147958688 55.37272771750537,-10.545143281961586 55.288328552258236,-5.830120063957665 53.18084586965389,1.840794282752526 49.195265721482116,9.25735892668726 49.09800024435427,17.27537564241723 54.60238129796301,26.79606236510685 67.66572058146954,23.972963097079486 76.8985475801422,25.156087686584726 80.90198693734246,24.224336265016916 98.65202434926476,29.12390464298099 87.32304470382297,30.841749313557045 73.19064932718621,26.49600844997913 74.34362449929938,45.37780122113685 84.86135437548865,48.854489929252026 94.20661757723803,58.77076811771508 98.98578032013964,42.02795130402447 99.46058563543778,34.59563983062384 98.63627751979888,30.601898215960546 102.77279678943651,17.398949846823413 103.89917518251286,28.03574111653535 105.45119805743272,38.16738561905149 102.97299276160973,48.21357476653921 102.30423259557307,58.24709002072095 103.14246321287385,68.27042706203255 112.41446525070566,75.8324574599522 113.38760010824794,85.47700643880654 106.34262223280734,78.94610493507602 101.62875122183755,69.83358793828197 94.02447284859886,63.566637862611 82.93361599020244,54.07418021225661 72.91603998406134,43.252363312251276 61.06981539756572,34.691273014453344 54.62110466226699,33.40329758484586 50.560343005120814,28.13281455915748 45.51338814404596,24.706630926036624 54.13640956992626,47.13942975900835 69.40219259909674,67.50248107381125 72.07329655587696,91.94232815884672 73.28244182090208,100 69.67315328661365,97.29941874659758 68.37701639051471,91.71006242422467 66.55998589775402,87.03190983131165 64.96389110378016,82.27108638370265 63.44336188779212,77.48942719222714 z M 42.16891519309266,16.834464417371933 C 44.72700684327924,6.352356941986642 45.64445169417377,-4.887422675565972 43.73582074220289,-15.528054635391555 36.166780700756874,-26.671048862080582 27.17889371408124,-16.771766111439376 22.226803898813174,-9.275411130393891 18.206369487860158,-2.6890116545213516 2.664440839519358,4.584679317186158 7.39741928380451,12.122033665194706 16.921946696607762,16.829567537477047 26.72991703979733,21.314341383168568 37.03285632138153,23.969122406965866 39.93075302937194,22.952491733886717 41.06730925124933,19.39582065415506 42.16891519309266,16.834464417371933 z"
        });
        shapesAlt.push({
            d: "M -11.932078358007274,97.17779884149886 C -13.635549500883954,80.81248168842868 -9.882262834961182,64.35002157812718 -7.3153097528584965,48.20486218541777 -1.9633265709609589,19.58268099276812 8.171062879456613,-7.8998546116869335 19.858252763575862,-34.46032512617754 3.726177833327256,-18.22228507217359 -7.627059345197594,2.0228028421531263 -19.709759840901256,21.325703196803246 -31.068844430698604,41.03987521134664 -37.00745113245839,63.233174946367456 -42.96756806046227,85.00925569175209 -43.28060628386666,66.96961028297457 -39.399745142477926,49.04475226360191 -35.3267788468911,31.539194769537716 -32.85389583255622,21.537831695247007 -28.24555289206529,9.909423212799311 -25.8708040896273,1.1616999141246538 -41.38512911225839,16.458147161251333 -49.26262993998082,37.35746325401607 -58.03483722889644,56.86376896692701 -62.74131438128426,66.95365108285799 -57.5672624031211,46.66316380397109 -56.156409637536925,43.894391321509914 -46.562947858150935,14.03899014979335 -35.169466731456396,-16.788930825679742 -12.282288631372595,-39.21448162798193 -8.108214359892003,-43.861483500432264 -0.5994592765274263,-51.756430410269694 1.7904557222946096,-55.268743066979006 -19.94349769105564,-41.30860623458146 -39.62426432424202,-24.244950169578388 -55.93635110176815,-4.188200641720414 -73.92177488033599,15.999592752933168 -81.66277994060184,42.622710710979504 -90.66545393927528,67.39069526493208 -92.31341482087696,58.799788454359316 -88.05448915001884,46.738499158558625 -84.84133715139518,37.66286881649518 -77.13353912242778,20.1107223531466 -69.57403279143787,2.3610189340644183 -60.084256250076265,-14.297015721764865 -53.35472745061422,-22.863537667563293 -46.83435338559908,-31.844106687193303 -41.01747275677804,-40.92300816965331 -58.2006741344555,-31.069342040540732 -74.40332639689666,-18.97980188764427 -86.1820090866531,-2.8256219783522027 -95.67545327027752,7.746802908805094 -86.1368078739006,-9.731990610161745 -82.38708972477407,-13.068950316521978 -73.05958157217529,-25.606339327347868 -62.52363485671301,-37.41822904840275 -51.857536403654116,-48.61048547797541 -40.83349589083804,-56.684252746982274 -29.811636138286318,-64.76961967808629 -17.46436977232733,-70.73142173902168 -8.035158891035437,-76.68440163343304 -27.50924892643897,-69.2011227862297 -31.054966865379853,-67.79770443063774 -45.64316265391744,-62.46059105997924 -59.89006946108032,-56.20884700934848 -73.05175066031686,-47.88597744287004 -81.9394391177778,-43.098911286166896 -90.51458497916715,-37.58287644836308 -100,-34.02526345343469 -85.50458564816492,-46.88391810138967 -69.32334448650127,-57.74895938333016 -55.05988372642247,-70.91549773042826 -37.88005261460814,-84.94908653354862 -17.457034487801707,-95.46778541782905 4.2862367194053945,-100 7.91898681798817,-90.79580392780497 15.231175109904612,-79.18424677467291 1.8446773525043056,-75.44047615354015 -2.7331349442853963,-70.37704819606073 11.612798203973426,-67.4728702767124 12.227276971194385,-61.53991372654667 20.338119147204978,-56.11685857637848 33.66533987560092,-56.32571593442569 43.94484900906599,-56.45616504842194 62.73001705186013,-58.003910083328925 81.13127216265767,-62.24766955780297 98.81238075887862,-68.74187449964562 107.77510719452735,-71.69779591253958 116.73436423884641,-74.66382812302291 125.69560379249674,-77.62391280551249 132.82728460980286,-73.34030489348031 138.1444737616823,-66.76432144172361 144.07842156651367,-61.04448464466726 137.9435464409601,-39.42611449909289 139.68131499526743,-16.683461329257227 137.85978542171478,5.4450104497571346 131.36339971960774,0.2552966478770884 126.78707430481651,-9.35858497762078 121.35688212105578,-16.51306465223628 116.1353490444092,-22.613245864492953 113.47085650320898,-35.629311753349185 108.92674686505055,-39.09077304571193 101.31044164172033,-26.08382669977945 95.05284914891223,-12.33472798569349 91.4918659277709,2.3641909489944055 86.6016101603762,19.223152925545904 82.02300485985398,36.20056993376508 79.24818567436972,53.54197545695081 74.97885182952254,48.053993225309654 75.3517618347307,33.59238055844693 74.46260639966502,24.417624749820945 73.78994098357185,11.077815087171587 74.71051919153786,-2.289353204249039 74.09604042431687,-15.623512715304344 65.69456238034505,-0.9630544616426988 58.69224029690295,14.580710824557457 55.381747090114914,31.23983586051895 53.02295748779352,41.261519754580405 49.31546678742262,51.10150656930736 49.283151885323235,61.5185026257692 44.41926349203416,59.150395229590856 46.4948516363865,41.73940362887828 46.15742854820772,33.821756987198 46.665446564340584,10.982555513805025 53.12138907609011,-11.115980374307455 60.269921222711815,-32.62828825316929 55.19271482538025,-25.61109734974285 49.94382311996236,-15.331092588944955 43.287647165756596,-8.20149340643664 36.476042479980805,1.5365924286640364 32.685881140496775,13.093432324253598 27.44828973826702,23.721763974552147 19.053552226021452,44.72367492520911 13.01244979183602,66.62574403946923 8.54357638279852,88.76561524713827 4.915980808477016,81.8346634996212 9.472481129955781,67.72167519778432 9.600848609154227,58.16042919503113 11.198453753742157,41.426662781873574 14.610847940156432,24.93991683313881 17.53197631428695,8.425217601958892 4.062114039507577,35.90894281113816 -7.090394069228182,65.18991165631132 -10.121353460309962,95.85566336848814 -9.34232641859522,96.42860856521943 -11.723022749026939,100 -11.932078358007274,97.17779884149886 z"
        });

        width = p.width;
        height = p.height;
        size = 1;
        opacity = 1;
        mode = MODE_FILL;
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
                    bezier = new LIB.CatmullLine();
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
                    if (splat && mode !== MODE_PULL) {
                        displace = LIB.Vec2.add({
                            x: p.x,
                            y: p.y
                        }, LIB.Vec2.mul(LIB.Vec2.sub({
                            x: p.x,
                            y: p.y
                        }, lastIn), -5 * Math.random()));
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

        function drawPullPath(pullShape, context) {
            context.save();
            context.translate(pullShape.x, pullShape.y);
            context.scale(pullShape.scale, pullShape.scale);
            context.rotate(pullShape.angle / 180 * Math.PI);
            var shapeLibArr = shapes;
            if (pullShape.splat) {
                shapeLibArr = shapesAlt;
            }
            LIB.drawPathOnCanvas(shapeLibArr[pullShape.shape], context);
            context.fill();
            context.restore();
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
                    r: parseInt(p.color.r, 10),
                    g: parseInt(p.color.g, 10),
                    b: parseInt(p.color.b, 10)
                };
            }
            if (p.opacity !== undefined) {
                opacity = Math.max(0.05, Math.min(1, p.opacity));
            }
            if (p.size !== undefined) {
                size = 40 * Math.pow(p.size, 2) + 1;
            }
            if (p.mode === "MODE_PULL") {
                mode = MODE_PULL;
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
            if (p.context) {
                context = p.context;
            }
            if (p.width !== undefined && p.height !== undefined) {
                width = p.width;
                height = p.height;
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
                LIB.setAttributes(action.svgDefs[0], [
                    ["id", "grad" + shapeCounter],
                    ["x1", "0%"],
                    ["y1", "0%"],
                    ["x2", "0%"],
                    ["y2", "100%"]
                ]);
                stop0 = document.createElementNS("http://www.w3.org/2000/svg", "stop");
                LIB.setAttributes(stop0, [
                    ["offset", "0%"],
                    ["style", "stop-opacity: 0; stop-color: " + LIB.color.rgbToHex(color)]
                ]);
                stop1 = document.createElementNS("http://www.w3.org/2000/svg", "stop");
                LIB.setAttributes(stop1, [
                    ["offset", "100%"],
                    ["style", "stop-opacity: 1; stop-color: " + LIB.color.rgbToHex(color)]
                ]);
                action.svgDefs[0].appendChild(stop0);
                action.svgDefs[0].appendChild(stop1);
            }

            if (mode === MODE_PULL) {
                action.svgShapes[0] = document.createElementNS("http://www.w3.org/2000/svg", "g");
                LIB.setAttributes(action.svgShapes[0], [
                    ["id", "drawing" + shapeCounter]
                ]);
                action.pulls = [];
            } else {
                action.svgShapes[0] = document.createElementNS("http://www.w3.org/2000/svg", "path");
                LIB.setAttributes(action.svgShapes[0], [
                    ["id", "drawing" + shapeCounter]
                ]);
                if (mode === MODE_STROKE) {
                    LIB.setAttributes(action.svgShapes[0], [
                        ["stroke", brushCol],
                        ["stroke-opacity", opacity],
                        ["stroke-width", size],
                        ["fill", "none"],
                        ["stroke-linecap", "round"],
                        ["stroke-linejoin", "round"]
                    ]);
                } else {
                    LIB.setAttributes(action.svgShapes[0], [
                        ["fill", brushCol],
                        ["fill-opacity", opacity]
                    ]);
                }
            }
            if (mirrorHorizontal) {
                mshape = document.createElementNS("http://www.w3.org/2000/svg", "use");
                mshape.setAttributeNS("http://www.w3.org/1999/xlink", "xlink:href", "#drawing" + shapeCounter);
                LIB.setAttributes(mshape, [
                    ["x", -width],
                    ["y", 0],
                    ["transform", "scale(-1, 1)"]
                ]);
                action.svgShapes.push(mshape);
            }
            if (mirrorVertical) {
                mshape = document.createElementNS("http://www.w3.org/2000/svg", "use");
                mshape.setAttributeNS("http://www.w3.org/1999/xlink", "xlink:href", "#drawing" + shapeCounter);
                LIB.setAttributes(mshape, [
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
            var i, dat, pathString, oldlen, pullShape, shapeId, brushCol, posX, posY, scale, angle, grad;
            inputHandler.add(p);
            oldlen = parseInt(action.input.length, 10);
            action.input = inputHandler.getData();
            //don't update if no new inputs
            if (action.input.length < 2 || oldlen === action.input.length) {
                return false;
            }
            if (action.gradient && mode !== MODE_PULL) {
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
            if (mode === MODE_PULL) {
                if (Math.random() > 0.5 || action.pulls.length === 0) {
                    pullShape = document.createElementNS("http://www.w3.org/2000/svg", "use");
                    shapeId = parseInt(Math.min(shapes.length - 1, (Math.random() * shapes.length)), 10);
                    pullShape.setAttributeNS("http://www.w3.org/1999/xlink", "xlink:href", "#pull" + shapeId);
                    if (action.splat) {
                        shapeId = parseInt(Math.min(shapesAlt.length - 1, (Math.random() * shapesAlt.length)), 10);
                        pullShape.setAttributeNS("http://www.w3.org/1999/xlink", "xlink:href", "#pullAlt" + shapeId);
                    }
                    brushCol = LIB.color.rgbToHex(color);
                    if (action.gradient) {
                        brushCol = 'url(#grad' + (shapeCounter - 1) + ')';
                    }
                    LIB.setAttributes(pullShape, [
                        ["fill", brushCol],
                        ["fill-opacity", opacity]
                    ]);
                    posX = action.input[action.input.length - 1].x;
                    posY = action.input[action.input.length - 1].y;
                    scale = (0.1 + Math.random() * 2) * (Math.min(width, height) / 1200) / zoom;
                    angle = parseInt(Math.random() * 360, 10);
                    pullShape.setAttribute("transform", "translate(" + posX + ", " + posY + ") scale(" + scale + ") rotate(" + angle + ")");
                    action.svgShapes[0].appendChild(pullShape);
                    action.pulls.push({
                        x: posX,
                        y: posY,
                        scale: scale,
                        angle: angle,
                        shape: shapeId,
                        splat: action.splat
                    });
                    //DRAW ON CANVAS - for better performance - can't be done for other brush modes
                    context.save();
                    context.fillStyle = "rgba(" + color.r + ", " + color.g + ", " + color.b + ", " + opacity + ")";
                    if (gradient) {
                        grad = context.createLinearGradient(0, -100, 0, 100);
                        grad.addColorStop(0, "rgba(" + color.r + ", " + color.g + ", " + color.b + ", 0)");
                        grad.addColorStop(1, "rgba(" + color.r + ", " + color.g + ", " + color.b + ", " + opacity + ")");
                        context.fillStyle = grad;
                        context.strokeStyle = grad;
                    }
                    drawPullPath(action.pulls[action.pulls.length - 1], context);
                    if (action.mirrorHorizontal) {
                        context.translate(width, 0);
                        context.scale(-1, 1);
                        drawPullPath(action.pulls[action.pulls.length - 1], context);
                    }
                    if (action.mirrorVertical) {
                        context.translate(0, height);
                        context.scale(1, -1);
                        drawPullPath(action.pulls[action.pulls.length - 1], context);
                    }
                    context.restore();
                }
            } else {
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
            }

            return true;
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
            if (!p.width) {
                p.width = width;
            }
            if (!p.height) {
                p.height = height;
            }
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
            if (a.mode !== MODE_PULL) {

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
                drawPath();
                if (a.mirrorHorizontal) {
                    context.save();
                    context.translate(p.width, 0);
                    context.scale(-1, 1);
                    drawPath();
                    context.restore();
                }
                if (a.mirrorVertical) {
                    context.save();
                    context.translate(0, p.height);
                    context.scale(1, -1);
                    drawPath();
                    context.restore();
                }
            } else {
                i = 0;
                context.fillStyle = "rgba(" + a.color.r + ", " + a.color.g + ", " + a.color.b + ", " + a.opacity + ")";
                if (a.gradient) {
                    grad = context.createLinearGradient(0, -100, 0, 100);
                    grad.addColorStop(0, "rgba(" + a.color.r + ", " + a.color.g + ", " + a.color.b + ", 0)");
                    grad.addColorStop(1, "rgba(" + a.color.r + ", " + a.color.g + ", " + a.color.b + ", " + a.opacity + ")");
                    context.fillStyle = grad;
                    context.strokeStyle = grad;
                }
                for (i = 0; i < a.pulls.length; i += 1) {
                    drawPullPath(a.pulls[i], context);
                }
                if (a.mirrorHorizontal) {
                    context.translate(p.width, 0);
                    context.scale(-1, 1);
                    for (i = 0; i < a.pulls.length; i += 1) {
                        drawPullPath(a.pulls[i], context);
                    }
                }
                if (a.mirrorVertical) {
                    context.translate(0, p.height);
                    context.scale(1, -1);
                    for (i = 0; i < a.pulls.length; i += 1) {
                        drawPullPath(a.pulls[i], context);
                    }
                }

            }
            context.restore();
        };
        this.getAction = function () {
            return action;
        };
        this.getPullDefs = function () {
            var i, defs, oSerializer, result;
            defs = [];
			function getShape(i, shapeLib) {
				var shape = document.createElementNS("http://www.w3.org/2000/svg", "path");
				LIB.setAttributes(shape, [
					["id", "pull" + i],
					["d", shapeLib[i].d]
				]);
				defs.push(shape);
			}
            for (i = 0; i < shapes.length; i += 1) {
                getShape(i, shapes);
            }
            for (i = 0; i < shapesAlt.length; i += 1) {
                getShape(i, shapesAlt);
            }

            oSerializer = new window.XMLSerializer();
            result = "";
            for (i = 0; i < defs.length; i += 1) {
                result += oSerializer.serializeToString(defs[i]).replace(" href", " xlink:href").replace('xmlns:xlink="http://www.w3.org/1999/xlink"', "").replace('xmlns="http://www.w3.org/2000/svg"', "") + "\n";
            }
            return result;
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
		resized: <boolean>			On canvas size change -> so that view gets reset
	}
	clear({r, g, b})				Clear the canvas with a color
	undo()							Undo action
	redo()							Redo action
	onInput(evt)					Send input events (x, y, down, dragdone)
	updateBrush(p)					Calls update(p) for the WebchemyBrush
	pick(x, y)						Pick color at x, y - updates brush color
	setSize({width, height})		Update width/height of the canvas, will be used on next clear()
	getCanvasDiv()					Returns div element of the WebchemyCanvas
	getCanvasImage()				Returns canvas object of the WebchemyCanvas
	getSVGString()					Returns string of complete svg element
	*/
    function WebchemyTools(p) {
        var callback, width, height, canvas, context, brush, svgOut, MAX_UNDO, undoStack, redoStack, historyCanvas,
			historyContext;
        callback = p.callback;
        width = p.width;
        height = p.height;
        canvas = new WebchemyCanvas();
        canvas.clear({
            width: width,
            height: height,
            color: {
                r: 255,
                g: 255,
                b: 255
            }
        });
        context = canvas.getContext();
        brush = new WebchemyBrush({
            width: width,
            height: height
        });
        brush.update({
            context: context
        });
        svgOut = {
            defs: "",
            shapes: ""
        };
        MAX_UNDO = 10;
        undoStack = [];
        redoStack = [];

        historyCanvas = document.createElement("canvas");
        historyContext = historyCanvas.getContext("2d");
        if (global.retina) {
            historyCanvas.width = width * 2;
            historyCanvas.height = height * 2;
            historyContext.scale(2, 2);
        } else {
            historyCanvas.width = width;
            historyCanvas.height = height;
        }
        historyCanvas.style.width = width + "px";
        historyCanvas.style.height = height + "px";
        historyContext.fillStyle = "rgba(" + 255 + ", " + 255 + ", " + 255 + ", 1)";
        historyContext.fillRect(0, 0, historyCanvas.width, historyCanvas.height);

        svgOut.defs += brush.getPullDefs();

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

        function updateUndoStack() {
            var action, serA, DRAW_NATIVE, cSize;
            DRAW_NATIVE = false;
            if (undoStack.length > MAX_UNDO) {
                action = undoStack.shift();
                if (action.clear) {
                    svgOut = {
                        defs: "",
                        shapes: ""
                    };
                    svgOut.defs += brush.getPullDefs();
                    if (global.retina) {
                        historyCanvas.width = action.width * 2;
                        historyCanvas.height = action.height * 2;
                        historyContext.setTransform(1, 0, 0, 1, 0, 0);
                        historyContext.scale(2, 2);
                    } else {
                        historyCanvas.width = action.width;
                        historyCanvas.height = action.height;
                    }
                    historyContext.fillStyle = "rgba(" + action.color.r + ", " + action.color.g + ", " + action.color.b + ", 1)";
                    historyContext.fillRect(0, 0, action.width, action.height);
                    if (action.color.r !== 255 || action.color.g !== 255 || action.color.b !== 255) {
                        svgOut.shapes += '<rect x="0" y="0" width="' + action.width + '" height="' + action.height + '" fill="' + LIB.color.rgbToHex(action.color) + '" ></rect>';
                    }

                } else {
                    serA = serializeAction(action);
                    svgOut.defs += serA.defs;
                    svgOut.shapes += serA.shapes;
                    if (DRAW_NATIVE) {
                        cSize = canvas.getSize();
                        LIB.drawSVGToContext({
                            width: historyCanvas.width,
                            height: historyCanvas.height,
                            context: historyContext,
                            defs: serA.defs,
                            shapes: serA.shapes,
                            callback: function () {}
                        });
                    } else {
                        brush.drawActionOnContext({
                            context: historyContext,
                            action: action,
                            width: historyCanvas.width / (global.retina ? 2 : 1),
                            height: historyCanvas.height / (global.retina ? 2 : 1)
                        });
                    }
                }
            }
        }
        this.clear = function (p) {
			var clearShapes, clearRect;
            canvas.clear({
                width: width,
                height: height,
                color: p
            });
            brush.update({
                width: width,
                height: height
            });
            clearShapes = [];
            if (p.r !== 255 || p.g !== 255 || p.b !== 255) {
                clearRect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
                LIB.setAttributes(clearRect, [
                    ["x", 0],
                    ["y", 0],
                    ["width", width],
                    ["height", height],
                    ["fill", LIB.color.rgbToHex(p)]
                ]);
                clearShapes.push(clearRect);
            }
            undoStack.push({
                clear: true,
                width: parseInt(width, 10),
                height: parseInt(height, 10),
                color: {
                    r: p.r,
                    g: p.g,
                    b: p.b
                },
                svgDefs: [],
                svgShapes: clearShapes
            });
            redoStack = [];

            updateUndoStack();
            undoStateCallback();
        };
        this.undo = function () {
            var action, ctx, oldW, oldH, i;
            if (brush.isDrawing() || undoStack.length === 0) {
                return;
            }
            action = undoStack.pop();
            ctx = canvas.getContext();
            oldW = ctx.canvas.width;
            oldH = ctx.canvas.height;
            ctx.canvas.width = historyCanvas.width;
            ctx.canvas.height = historyCanvas.height;
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.drawImage(historyCanvas, 0, 0, ctx.canvas.width, ctx.canvas.height);
            if (global.retina) {
                ctx.scale(2, 2);
            }
            brush.update({
                width: historyCanvas.width / (global.retina ? 2 : 1),
                height: historyCanvas.height / (global.retina ? 2 : 1)
            });
            for (i = 0; i < undoStack.length; i += 1) {
                if (undoStack[i].clear) {
                    ctx = canvas.getContext();
                    if (global.retina) {
                        ctx.canvas.width = undoStack[i].width * 2;
                        ctx.canvas.height = undoStack[i].height * 2;
                    } else {
                        ctx.canvas.width = undoStack[i].width;
                        ctx.canvas.height = undoStack[i].height;
                    }
                    ctx.setTransform(1, 0, 0, 1, 0, 0);
                    ctx.fillStyle = "rgba(" + undoStack[i].color.r + ", " + undoStack[i].color.g + ", " + undoStack[i].color.b + ", 1)";
                    ctx.fillRect(0, 0, undoStack[i].width * 2, undoStack[i].height * 2);
                    if (global.retina) {
                        ctx.scale(2, 2);
                    }
                    brush.update({
                        width: undoStack[i].width,
                        height: undoStack[i].height
                    });
                } else {
                    brush.drawActionOnContext({
                        context: canvas.getContext(),
                        action: undoStack[i]
                    });
                }
            }
            if (oldW !== ctx.canvas.width || oldH !== ctx.canvas.height) {
                canvas.setSize({
                    width: ctx.canvas.width / (global.retina ? 2 : 1),
                    height: ctx.canvas.height / (global.retina ? 2 : 1)
                });
                callback({
                    resized: true
                });
            }
            redoStack.push(action);
            undoStateCallback();
        };
        this.redo = function () {
            var action, ctx;
            if (brush.isDrawing() || redoStack.length === 0) {
                return;
            }
            action = redoStack.pop();
            if (action.clear) {
                ctx = canvas.getContext();
                if (global.retina) {
                    ctx.canvas.width = action.width * 2;
                    ctx.canvas.height = action.height * 2;
                } else {
                    ctx.canvas.width = action.width;
                    ctx.canvas.height = action.height;
                }
                ctx.canvas.style.width = action.width + "px";
                ctx.canvas.style.height = action.height + "px";
                ctx.setTransform(1, 0, 0, 1, 0, 0);
                ctx.fillStyle = "rgba(" + action.color.r + ", " + action.color.g + ", " + action.color.b + ", 1)";
                ctx.fillRect(0, 0, action.width * 2, action.height * 2);
                if (global.retina) {
                    ctx.scale(2, 2);
                }
                canvas.setSize({
                    width: ctx.canvas.width / (global.retina ? 2 : 1),
                    height: ctx.canvas.height / (global.retina ? 2 : 1)
                });
                brush.update({
                    width: ctx.canvas.width / (global.retina ? 2 : 1),
                    height: ctx.canvas.height / (global.retina ? 2 : 1)
                });
                callback({
                    resized: true
                });
            } else {
                brush.drawActionOnContext({
                    context: canvas.getContext(),
                    action: action
                });
            }
            undoStack.push(action);
            undoStateCallback();
        };
        this.onInput = function (p) {
            var action, serA, cSize, DRAW_NATIVE;
            DRAW_NATIVE = false;
            if (p.down) {
                brush.startLine({
                    x: p.x,
                    y: p.y
                });
                action = brush.getAction();
                if (action.mode !== 2) {
                    addActionShapes(action);
                }
            } else if (p.dragdone === false) {
                brush.goLine({
                    x: p.x,
                    y: p.y
                });
            } else if (p.dragdone) {
                action = brush.getAction();
                brush.endLine();
                if (brush.getAction() !== undefined) {
                    if (action.mode !== 2) {
                        if (DRAW_NATIVE) {
                            serA = serializeAction(action);
                            cSize = canvas.getSize();
                            LIB.drawSVGToContext({
                                width: cSize.width,
                                height: cSize.height,
                                context: canvas.getContext(),
                                defs: serA.defs,
                                shapes: serA.shapes,
                                callback: function () {
                                    removeActionShapes(action);
                                }
                            });
                        } else {
                            brush.drawActionOnContext({
                                context: canvas.getContext(),
                                action: action
                            });
                            removeActionShapes(action);
                        }

                    }
                    redoStack = [];
                    updateUndoStack();
                    undoStack.push(action);
                    undoStateCallback();
                }
            }
        };
        //mode, modifiers, zoom, color, etc
        this.updateBrush = function (p) {
            brush.update(p);
        };
        this.pick = function (p) {
            var col, ctx, data;
			col = {};
            ctx = canvas.copy1pxCanvasContext(p.x, p.y);
            data = ctx.getImageData(0, 0, 1, 1).data;
            col.r = data[0];
            col.g = data[1];
            col.b = data[2];

            brush.update({
                color: col
            });
            return col;
        };
        this.setSize = function (p) {
            width = p.width;
            height = p.height;
        };
        this.getCanvasDiv = function () {
            return canvas.getDiv();
        };
        this.getCanvasImage = function () {
            var ctx;
            ctx = canvas.copyCanvasContext();
            return ctx.canvas;
        };
        this.getSVGString = function () {
            var i, cSize, svgStart, outDefs, outShapes, serA, lastClear;
            cSize = canvas.getSize();
            lastClear = -1;
            for (i = 0; i < undoStack.length; i += 1) {
                if (undoStack[i].clear) {
                    lastClear = i;
                }
            }
            svgStart = '<?xml version="1.0" encoding="UTF-8" standalone="no"?> \n' + '<svg \n' + 'xmlns:dc="http://purl.org/dc/elements/1.1/" \n' + 'xmlns:cc="http://creativecommons.org/ns#" \n' + 'xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" \n' + 'xmlns:svg="http://www.w3.org/2000/svg" \n' + 'xmlns="http://www.w3.org/2000/svg" \n' + 'xmlns:xlink="http://www.w3.org/1999/xlink" \n' + 'width="' + cSize.width + '" \n' + 'height="' + cSize.height + '" \n' + 'id="svg3112" \n' + 'version="1.1">';
            if (lastClear === -1) {
                outDefs = svgOut.defs.toString();
                outShapes = svgOut.shapes.toString();
                lastClear = 0;
            } else {
                outDefs = "";
                outShapes = "";
                outDefs += brush.getPullDefs();
            }
            for (i = lastClear; i < undoStack.length; i += 1) {
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
			barDiv, barHidden, messageKill, firstHide, ua, isSafariIphone, mobileSafari,
			exitWarning;
        barHidden = false;
        wcDivClass = "WebchemyAppMainDiv";
        fullscreen = true;
        target = document.body;
        width = window.innerWidth;
        height = window.innerHeight;
		exitWarning = false;
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
        firstHide = true;

        ua = navigator.userAgent.toLowerCase();
        global.isTouchDevice = (ua.indexOf("android") > -1 && ua.indexOf("mobile") > -1) || navigator.userAgent.match(/(iPod|iPhone|iPad)/) ? true : false;
        //iphone mobile fullscreen
        isSafariIphone = navigator.userAgent.match(/(iPod|iPhone)/) && navigator.userAgent.match(/Safari/) && !navigator.userAgent.match(/Chrome/) && !navigator.userAgent.match(/CriOS/) && !navigator.userAgent.match(/Opera/) && !navigator.userAgent.match(/Mercury/);
        mobileSafari = {
            iphone: isSafariIphone,
            screenHeight: 480,
            screenWidth: 320,
            chromeHeight: 64,
            chromeWidth: 51
        };
		function resize(w, h) {
            if (w === width && h === height) {
                return;
            }
            width = w;
            height = h;
            global.height = height;
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
		//only used when fullscreen on iPhone with Safari
        function updateIphoneFS() {
            if (!mobileSafari.iphone) {
                return;
            }
            var h = window.innerHeight;
            if (window.orientation === 0) {
                resize(mobileSafari.screenWidth, mobileSafari.screenHeight - mobileSafari.chromeHeight);
            } else {
                if (h > mobileSafari.screenWidth - 20) {
                    resize(mobileSafari.screenHeight, mobileSafari.screenWidth);
                } else {
                    resize(mobileSafari.screenHeight, mobileSafari.screenWidth - mobileSafari.chromeWidth);
                }
            }

            setTimeout(function () {
                window.scrollTo(0, 1);
            }, 20);
        }
        if (mobileSafari.iphone && fullscreen) {
            if (window.orientation === 0) {
                if (window.innerHeight >= 503) { //iPhone 5 should be fine without the hacked fullscreen.
					mobileSafari.iphone = false;
                    //mobileSafari.screenHeight = 568;
                }
            } else {
                if (window.innerWidth === 568) {
					mobileSafari.iphone = false;
                    //mobileSafari.screenHeight = 568;
                }
            }
		}
		if (mobileSafari.iphone && fullscreen) {
            //update Width Height
            if (window.orientation === 0) {
                width = mobileSafari.screenWidth;
                height = mobileSafari.screenHeight - mobileSafari.chromeHeight;
            } else {
                if (height > mobileSafari.screenWidth - 20) {
                    width = mobileSafari.screenHeight;
                    height = mobileSafari.screenWidth;
                } else {
                    width = mobileSafari.screenHeight;
                    height = mobileSafari.screenWidth - mobileSafari.chromeWidth;
                }
            }

            window.addEventListener("resize", function () {
                setTimeout(updateIphoneFS, 10);
            }, false);
            window.addEventListener("orientationchange", function () {
                setTimeout(updateIphoneFS, 200);
            }, false);
            window.addEventListener("touchstart", function () {
                if (global.forceFS) {
                    updateIphoneFS();
                }
            }, false);
        }
        global.height = height;
        /*webchemyDiv.oncontextmenu = function () {
			return false;
		};*/
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
                if (val.resized) {
                    view.reset();
                    bar.update({
                        initView: true
                    });
                }
            }
        });
        view = new WebchemyCanvasView({
            width: width,
            height: height,
            canvas: tools.getCanvasDiv(),
            callback: function (val) {
                if (!bar) {
                    return;
                }
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
                if (!bar.isHidden() && val.dragdone === false && !val.down) {
                    bar.update({
                        collapse: true
                    });
                }
                if (val.singleTap && fullscreen) {
                    bar.update({
                        toggleHide: true
                    });
                    return;
                }
                if (val.pick) {
                    if (messageKill) {
                        messageKill();
                        messageKill = undefined;
                    }
                    bar.update({
                        color: tools.pick(val.pick)
                    });
                }
                if (val.initView !== undefined) {
                    bar.update({
                        initView: val.initView
                    });
                }
				if(val.x != undefined) {
					exitWarning = true;
				}
                tools.onInput(val);
            }
        });
        bar = new WebchemyBar({
            parent: webchemyDiv,
            callback: function (val) {
                var BB, bb, finalim, canvas, im, data, intent, onSuccess, onError;
                if (val.color) {
                    tools.updateBrush({
                        color: val.color
                    });
                }
                if (val.clear) {
                    tools.clear(val.clearColor);
                    view.reset();
                }
                if (val.exportSVG) {
                    BB = window.BlobBuilder || window.WebKitBlobBuilder || window.MozBlobBuilder;
                    bb = new BB();
                    bb.append(tools.getSVGString());
                    window.saveAs(bb.getBlob("text/plain"), "Webchemy.svg");
                }
                if (val.exportPNG) {
                    if (window.chrome) {
                        finalim = tools.getCanvasImage();
						(function() {
							var parts, binStr, buf, view, i, blob;
							parts = finalim.toDataURL("image/png").match(/data:([^;]*)(;base64)?,([0-9A-Za-z+/]+)/);
							binStr = atob(parts[3]);
							buf = new ArrayBuffer(binStr.length);
							view = new Uint8Array(buf);
							for (i = 0; i < view.length; i += 1) {
								view[i] = binStr.charCodeAt(i);
							}
							blob = new Blob([view], {'type': parts[1]});
							saveAs(
								blob
								, "Webchemy.png"
							);
						}());
                    } else {
                        canvas = tools.getCanvasImage();
                        im = new Image();
                        im.width = canvas.width;
                        im.height = canvas.height;
                        im.src = canvas.toDataURL("image/png");
                        UI.showExportPage(webchemyDiv, im);
                    }
                }
                if (val.resetView) {
                    view.reset();
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
                if (val.brushMode === "pull") {
                    tools.updateBrush({
                        mode: "MODE_PULL"
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
                if (val.pick) {
                    view.enterPickerMode();
                    messageKill = UI.spawnMessage("Tap/Click to Pick Color");
                }
                if (val.intentEdit) {
                    data = tools.getCanvasImage().toDataURL('image/png');
                    intent = new window.WebKitIntent("http://webintents.org/edit", "image/png", data);
                    onSuccess = function () {};
                    onError = function () {};
                    window.navigator.webkitStartActivity(intent, onSuccess, onError);
                }
                if (val.barHidden) {
                    if (firstHide) {
                        firstHide = false;
                        messageKill = UI.spawnMessage("Tap/click anywhere to show/hide tool bar");
                    }
                }
                if (val.barHidden === false) {
                    if (messageKill) {
                        messageKill();
                        messageKill = undefined;
                    }
                }
            }
        });
        barDiv = bar.getDiv();
        //Styling
        LIB.css(barDiv, {
            left: width / 2 + "px"
        });
        LIB.css(webchemyDiv, {
            overflow: "hidden"
        });
        if (fullscreen) {
            LIB.css(webchemyDiv, {
                width: "100%",
                height: height + "px"
            });
            LIB.addCssRule("body", "margin: 0px; overflow: hidden;");
            if (!mobileSafari.iphone) {
                window.addEventListener("resize", function () {
                    resize(window.innerWidth, window.innerHeight);
                }, false);
            } else {
                updateIphoneFS();
            }
        } else {
            LIB.css(webchemyDiv, {
                width: width + "px",
                height: height + "px",
                position: "relative"
            });
        }
        LIB.addCssRule("." + wcDivClass, "color: " + UI.theme.textColor + "; font-family: arial;");
        LIB.addCssRule("." + wcDivClass + " a", "color: " + UI.theme.linkColor + "; text-decoration: none; text-shadow: 1px 1px 1px #000; padding-right: 13px; background: url(linkim.svg) center right no-repeat;");
        LIB.addCssRule("." + wcDivClass + " a:hover", "color: " + UI.theme.linkHoverColor + ";");
        LIB.addCssRule("button", "font-size: " + (UI.theme.halfBoxSize * 2 / 3) + "px; padding: 5px; background: " + UI.theme.barCol + "; color: #fff; border: 1px solid #fff; border-radius: 5px; cursor: pointer;");
        LIB.addCssRule("button:active", "background: " + UI.theme.expandCol + ";");
        LIB.addCssRule("button:disabled", "opacity: 0.5");
        //I wish this wasn't neccesary
        LIB.addCssRule(".WebchemyAppShadedPopupBG", "background: -webkit-linear-gradient(bottom, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 0.4) 100%); background-image: -moz-linear-gradient(center bottom, rgba(255, 255, 255, 0) 20%, rgba(255, 255, 255, 0.4) 100%); background-image: -o-linear-gradient(bottom, rgba(255, 255, 255, 0) 20%, rgba(255, 255, 255, 0.4) 100%); filter:progid:DXImageTransform.Microsoft.gradient(startColorstr='#88ffffff', endColorstr='#00ffffff'); background-image: linear-gradient(to top, rgba(255, 255, 255, 0) 20%, rgba(255, 255, 255, 0.4) 100%);");

        webchemyDiv.appendChild(view.getDiv());
        webchemyDiv.appendChild(barDiv);
        target.appendChild(webchemyDiv);
        
		function setExitWarning() {
			if(exitWarning) {
				window.onbeforeunload = function() {
					return "You are leaving this Webchemy session.\nMake sure you saved your drawing.";
				};
			} else {
				setTimeout(setExitWarning, 1000 * 30);
			}
		}
		setTimeout(setExitWarning, 1000 * 60); //after 60 seconds someone might have created a nice drawing that they don't want to lose accidentally
		

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