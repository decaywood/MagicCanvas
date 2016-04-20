[demo1 -- heartbeat](http://7xqo9j.com1.z0.glb.clouddn.com/MagicCanvas%2Findex.html?v=0.5-beta)

[demo2 -- random move](http://7xqo9j.com1.z0.glb.clouddn.com/MagicCanvas%2Findex2.html?v=0.5-beta)

# Dependencies
-
magic canvas depends on jQuery. Include them both in end of your HTML code (TweenLite.min.js is optional ,if you use random-move effect, it should be added):

```html
<!-- TweenLite.min.js is optional -->
<script src="TweenLite.min.js"></script>
<script src="jquery.js" type="text/javascript"></script>
<script src="magic-canvas.js" type="text/javascript"></script>
```

# Something you should know

the effect needs considerable performance. originally, it's running only on the browsers that requestAnimationFrame is built in. with [polyfill](https://remysharp.com/2010/10/08/what-is-a-polyfill), the early browser could work as well, but the best choice is to update the browser to the latest version rather than use fall-backed requestAnimationFrame.

**browsers supporting for requestAnimationFrame**:

* chrome 31+
* firefox 26+
* IE 10+
* opera 19+
* safari 6+


# Use like so:

demo1: heart-beat effect

```javascript
 $.magicCanvas.draw({
        lineLen : 30, // length of hive's side
        heartBeatCD : 3000, // boom period
        heartBeatRange : 300, // boom range
        rgb : function (circlePos, heartBeatCenter) {
            var px = circlePos.x; // a point on boom circle
            var py = circlePos.y;
            var hbcx = heartBeatCenter.x;
            var hbcy = heartBeatCenter.y;

            var dis = Math.pow((px - hbcx), 2) + Math.pow((py - hbcy), 2);
            var maxDis = 300 * 300;

            var r = parseInt(255 * dis / maxDis);
            // do some computation....
            return {r:r,g:217,b:203};
        },
    //  rgb: {r:156,g:217,b:249}; // parameter rgb can be a object as well
        zIndex:-9999 // stack order
    })
```

demo2: random-move

```javascript
 $.magicCanvas.draw({
            type:"random-move",
            rgb : function (circlePos) {
                var px = circlePos.x; // point position
                var py = circlePos.y;
                // do some computation....
                return {r:parseInt(px % 255),g:parseInt(py % 255),b:203};
            },
            zIndex = -9999; // stack order
        })
```

you can click the link on the top of the page to see the demo.

# LICENSE <a href="https://github.com/decaywood/MagicCanvas/blob/master/LICENSE"><img src="https://img.shields.io/badge/license-MIT-green.svg?style=flat"></a>
