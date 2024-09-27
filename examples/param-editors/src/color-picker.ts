import type { Fn2 } from "@thi.ng/api";
import { css, hsv, srgb } from "@thi.ng/color";
import { canvas, div, label, span, type Attribs } from "@thi.ng/hiccup-html";
import { clamp01 } from "@thi.ng/math";
import { Component, type ComponentLike } from "@thi.ng/rdom";
import {
	compileForm,
	type FormItem,
	type FormOpts,
	type Value,
} from "@thi.ng/rdom-forms";
import { __nextID, type ISubscription } from "@thi.ng/rstream";
import { range2d } from "@thi.ng/transducers";

export interface CustomColor extends Value {
	type: "customColor";
	attribs?: Partial<Attribs>;
	value?: ISubscription<string, string>;
}

export const canvasColorPicker = (spec: Partial<CustomColor>): CustomColor => {
	if (!compileForm.implForID("customColor")) {
		compileForm.add("customColor", colorPickerFormItem);
	}
	return {
		id: spec.id || `customcolor-${__nextID()}`,
		type: "customColor",
		...spec,
	};
};

const colorPickerFormItem: Fn2<FormItem, Partial<FormOpts>, ComponentLike> = (
	$val,
	opts
) => {
	const val = <CustomColor>$val;
	return new (class extends Component {
		ctx!: CanvasRenderingContext2D;
		canvas!: HTMLCanvasElement;

		async mount(parent: Element, idx?: number) {
			const $update = (e: MouseEvent | TouchEvent) => {
				const { left, top, width, height } =
					this.canvas!.getBoundingClientRect();
				let { clientX, clientY } = e.type.startsWith("touch")
					? (<TouchEvent>e).touches[0]
					: <MouseEvent>e;
				clientX = clamp01((clientX - left) / width);
				clientY -= top;
				const $hsv = hsv(val.value?.deref() ?? "#fff");
				if (clientY < height - 16) {
					const s = clientX;
					const v = clamp01(clientY / (height - 16));
					val.value?.next(css(srgb(hsv($hsv[0], s, v))));
				} else {
					val.value?.next(css(srgb(hsv(clientX, $hsv[1], $hsv[2]))));
				}
				e.preventDefault();
			};

			this.el = await this.$tree(
				div(
					{ ...opts.wrapperAttribs, ...val.wrapperAttribs },
					label(
						{ for: val.id },
						val.label || val.id,
						val.desc
							? span(
									{ ...opts.descAttribs, ...val.descAttribs },
									val.desc
							  )
							: null
					),
					canvas(val.attribs)
				),
				parent,
				idx
			);
			this.canvas = this.el!.getElementsByTagName("canvas")[0];
			this.ctx = this.canvas.getContext("2d")!;
			if (val.value) {
				val.value.subscribe({ next: this.update.bind(this) });
				let isDown = false;
				const start = (e: MouseEvent) => {
					isDown = true;
					$update(e);
				};
				const move = (e: MouseEvent) => isDown && $update(e);
				const end = () => (isDown = false);
				this.$attribs(
					{
						onmousedown: start,
						onmousemove: move,
						onmouseup: end,
						ontouchstart: start,
						ontouchmove: move,
						ontouchend: end,
					},
					this.canvas
				);
			} else {
				this.update("#fff");
			}
			return this.el!;
		}

		async unmount() {
			this.$remove();
			this.el = undefined;
		}

		update(col: string) {
			const ctx = this.ctx;
			const { width, height } = ctx.canvas;
			const sx = width / 16;
			const sy = height / 16 - 1;
			const cw = Math.ceil(sx);
			const ch = Math.ceil(sy);
			const [h, s, v] = hsv(col);
			for (let [x, y] of range2d(16, 16)) {
				ctx.fillStyle = css(hsv(h, x / 15, y / 15));
				ctx.fillRect(~~(x * sx), ~~(y * sy), cw, ch);
			}
			const grad = ctx.createLinearGradient(0, 0, width, 0);
			grad.addColorStop(0, "#f00");
			grad.addColorStop(1 / 6, "#ff0");
			grad.addColorStop(1 / 3, "#0f0");
			grad.addColorStop(1 / 2, "#0ff");
			grad.addColorStop(2 / 3, "#00f");
			grad.addColorStop(5 / 6, "#f0f");
			grad.addColorStop(1, "#f00");
			ctx.fillStyle = grad;
			ctx.fillRect(0, height - 16, width, 16);
			ctx.fillStyle = css(hsv(h, 1, 1));
			ctx.strokeStyle = "#000";
			ctx.beginPath();
			ctx.arc(h * width, height - 8, 8, 0, Math.PI * 2);
			ctx.fill();
			ctx.stroke();
			ctx.strokeStyle = v < 0.5 ? "#fff" : "#000";
			ctx.strokeRect(~~(s * 15.999) * sx, ~~(v * 15.9999) * sy, sx, sy);
		}
	})();
};
