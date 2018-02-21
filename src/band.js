import {range as sequence} from "d3-array";
import ordinal from "./ordinal";

export default function band() {
  var scale = ordinal().unknown(undefined),
      domain = scale.domain,
      ordinalRange = scale.range,
      range = [0, 1],
      step,
      bandwidth,
      round = false,
      paddingInner = 0,
      paddingOuter = 0,
      align = 0.5;

  delete scale.unknown;
  function rescale() {
    var n = domain().length,
        reverse = range[1] < range[0],
        start = range[reverse - 0],
        stop = range[1 - reverse];
    step = (stop - start) / Math.max(1, n - paddingInner + paddingOuter * 2);
    if (round) step = Math.floor(step);
    start += (stop - start - step * (n - paddingInner)) * align;
    bandwidth = step * (1 - paddingInner);
    if (round) start = Math.round(start), bandwidth = Math.round(bandwidth);
    var values = sequence(n).map(function(i) { return start + step * i; });
    return ordinalRange(reverse ? values.reverse() : values);
  }

  scale.domain = function(_) {
    return arguments.length ? (domain(_), rescale()) : domain();
  };

  scale.range = function(_) {
    return arguments.length ? (range = [+_[0], +_[1]], rescale()) : range.slice();
  };

  scale.rangeRound = function(_) {
    return range = [+_[0], +_[1]], round = true, rescale();
  };

  scale.bandwidth = function() {
    return bandwidth;
  };

  scale.step = function() {
    return step;
  };

  scale.round = function(_) {
    return arguments.length ? (round = !!_, rescale()) : round;
  };

  scale.padding = function(_) {
    return arguments.length ? (paddingInner = paddingOuter = Math.max(0, Math.min(1, _)), rescale()) : paddingInner;
  };

  scale.paddingInner = function(_) {
    return arguments.length ? (paddingInner = Math.max(0, Math.min(1, _)), rescale()) : paddingInner;
  };

  scale.paddingOuter = function(_) {
    return arguments.length ? (paddingOuter = Math.max(0, Math.min(1, _)), rescale()) : paddingOuter;
  };

  scale.align = function(_) {
    return arguments.length ? (align = Math.max(0, Math.min(1, _)), rescale()) : align;
  };

  scale.copy = function() {
    return band()
        .domain(domain())
        .range(range)
        .round(round)
        .paddingInner(paddingInner)
        .paddingOuter(paddingOuter)
        .align(align);
  };

  scale.invertExtent = function(r0, r1) {
    var lo = +r0,
        hi = arguments.length > 1 ? +r1 : lo,
        reverse = range[1] < range[0],
        values = reverse ? ordinalRange().reverse() : ordinalRange(),
        n = values.length - 1, a, b, t,
        hiIndex;
    values.push(values[n] + this.step());
    // order range inputs, bail if outside of scale range
    if (hi < lo) t = lo, lo = hi, hi = t;
    if (hi < values[0] || lo > range[1-reverse]) return undefined;

    // binary search to index into scale range
    a = Math.max(0, getClosestIndexOf(values, lo));
    hiIndex = getClosestIndexOf(values, hi);
    b = lo===hi ? a : Math.max(a, hiIndex - 1);

    // increment index a if lo is within padding gap
    // if (lo - values[a] > bandwidth + 1e-10) ++a;

    if (reverse) t = a, a = n - b, b = n - t; // map + swap
    return (a > b) ? undefined : domain().slice(a, b+1);
  };

  scale.invert = function (r0, r1) {
    var lo = +r0,
        hi = arguments.length > 1 ? +r1 : lo,
        reverse = range[1] < range[0],
        values = reverse ? ordinalRange().reverse() : ordinalRange(),
        n = values.length - 1,
        a,
        t;

    // order range inputs, bail if outside of scale range
    if (hi < lo) t = lo, lo = hi, hi = t;
    if (hi < values[0] || lo > range[1-reverse]) return undefined;

    // binary search to index into scale range
    a = Math.max(0, getClosestIndexOf(values, lo, 'left'));

    // increment index a if lo is within padding gap
    // if (lo - values[a] > bandwidth + 1e-10) ++a;

    return domain()[reverse ? n - a : a];
  }
  return rescale();
}

function pointish(scale) {
  var copy = scale.copy;

  scale.padding = scale.paddingOuter;
  delete scale.paddingInner;
  delete scale.paddingOuter;

  scale.copy = function() {
    return pointish(copy());
  };

  return scale;
}

export function point() {
  return pointish(band().paddingInner(1));
}

function getClosestIndexOf (arr, value, side) {
  var low = 0,
      arrLen = arr.length,
      high = arrLen - 1,
      highVal,
      mid,
      d1,
      d2;

  while (low < high) {
      mid = Math.floor((low + high) / 2);
      d1 = Math.abs(arr[mid] - value);
      d2 = Math.abs(arr[mid + 1] - value);

      if (d2 <= d1) {
          low = mid + 1;
      }
      else {
          high = mid;
      }
  }

  if (!side) {
      return high;
  }

  highVal = arr[high];
  if (highVal === value) {
      return high;
  } else if (highVal > value) {
      if (high === 0) { return high; }
      return side === 'left'? high - 1 : high;
  } else {
      if (high === arr.length - 1) { return high; }
      return side === 'left'? high : high + 1;
  }
}