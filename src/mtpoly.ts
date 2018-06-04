//*********************************************************************************
//
//  Copyright(c) 2008,2018 Kevin Willows. All Rights Reserved
//
//	License: Proprietary
//
//  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
//  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
//  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
//  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
//  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
//  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
//  THE SOFTWARE.
//
//*********************************************************************************

class EFMeasureText {

    public _measureText:Function;
    public _efthis:any;
    public font:string;
    public textAlign:string;

    public textSpan:HTMLSpanElement ;
    public block:HTMLDivElement ;
    public div:HTMLDivElement;


    constructor(proto:any) {

        this._measureText = proto.measureText;
        this.createCacheElements();

        proto._efthis      = this;
    }


    private createCacheElements() {

        this.textSpan = document.createElement('span');
        
        this.block = document.createElement("div");
        this.block.style.display = 'inline-block';
        this.block.style.width = '1px';
        this.block.style.height = '0px';

        this.div = document.createElement('div');

        // It is critical that the block comes first... otherwise it could be 
        // forced to the next line if the text goes off the edge of the page.
        // block would then have a incorrect height for the line.
        //
        this.div.appendChild(this.block);        
        this.div.appendChild(this.textSpan);
    }


    public measureText(text:string, hint?:string) : TextMetrics {

        var metrics  = this._efthis._measureText.call(this,text);
        var textSpan = this._efthis.textSpan;
        var block    = this._efthis.block;
        var div      = this._efthis.div;

        if(hint && hint.includes("ext")) {

            textSpan.innerHTML  = text;
            textSpan.style.font = this.font;

            var body = document.body;
            body.appendChild(div);

            var ascent = -1;
            var descent = -1;
            var height = -1;

            var new_metrics:any = {};
            
            // 
            // block.style['vertical-align'] requires 
            // 
            //            interface ElementCSSInlineStyle {
            //                readonly style: CSSStyleDeclaration | any;
            //            }
            // 
            // in the lib.dom.d.ts spec
            // 
            try {
                block.style['vertical-align'] = 'baseline';
                new_metrics.actualBoundingBoxAscent = ascent = block.offsetTop - textSpan.offsetTop;
                block.style['vertical-align'] = 'bottom';
                new_metrics.height = height = block.offsetTop - textSpan.offsetTop;
                new_metrics.actualBoundingBoxDescent = descent = height - ascent;
            } finally {
                document.body.removeChild(div);
            }

            // TODO This doesn't account for locale, and is guaranteed broken for those that read right-to-left
            if(hint.includes("all")) {

                switch(this.textAlign) {
                    case "start":
                    case "left":
                        new_metrics.actualBoundingBoxLeft = 0;
                        new_metrics.actualBoundingBoxRight = metrics.width;
                        break;

                    case "end":
                    case "right":
                        new_metrics.actualBoundingBoxLeft = -metrics.width;
                        new_metrics.actualBoundingBoxRight = 0;
                        break;

                    case "center":
                        // TODO This is probably just an approximation.
                        new_metrics.actualBoundingBoxLeft = -metrics.width/2.0;
                        new_metrics.actualBoundingBoxRight = metrics.width/2.0;
                        break;
                }
            }

            // Copy the new metrics over, if and only if the CanvasRenderingContext2D API doesn't provide them
            for(var key in new_metrics) {
                if (new_metrics.hasOwnProperty(key) && !(key in metrics)) {
                    metrics[key] = new_metrics[key];
                }
            }
        }

        return metrics;
    };
}

// This requires _measureText added to CanvasRenderingContext2D
//
//        measureText(text: string, hint?:string): TextMetrics;
//        _measureText(text: string, hint?:string): TextMetrics;    // custom
//
// in the lib.dom.d.ts spec
//
// Insert the updated measureText into the Canvas Context

CanvasRenderingContext2D.prototype.measureText = new EFMeasureText(CanvasRenderingContext2D.prototype).measureText;
