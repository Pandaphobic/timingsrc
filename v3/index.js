
/*
    Copyright 2020
    Author : Ingar Arntzen

    This file is part of the Timingsrc module.

    Timingsrc is free software: you can redistribute it and/or modify
    it under the terms of the GNU Lesser General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    Timingsrc is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Lesser General Public License for more details.

    You should have received a copy of the GNU Lesser General Public License
    along with Timingsrc.  If not, see <http://www.gnu.org/licenses/>.
*/

// utils
export * as utils from './util/utils.js';
export * as motionutils from './util/motionutils.js';
export {default as BinarySearch} from './util/binarysearch.js';
export {default as endpoint} from './util/endpoint.js';
export {default as eventify} from './util/eventify.js';
export {default as Interval} from './util/interval.js';
export {default as ObservableMap} from './util/observablemap.js';
export {default as Timeout} from './util/timeout.js';

// timing object
export {default as TimingObject} from './timingobject/timingobject.js';
export {default as SkewConverter} from './timingobject/skewconverter.js';
export {default as DelayConverter} from './timingobject/delayconverter.js';
export {default as ScaleConverter} from './timingobject/scaleconverter.js';
export {default as LoopConverter} from './timingobject/loopconverter.js';
export {default as RangeConverter} from './timingobject/rangeconverter.js';
export {default as TimeshiftConverter} from './timingobject/timeshiftconverter.js';
export {default as TimingSampler} from './timingobject/timingsampler.js';
export {default as PositionCallback} from './timingobject/positioncallback.js';

// timed data
export {default as Dataset} from './dataset/dataset.js';
export {default as Subset} from './dataset/subset.js';
import {default as PointModeSequencer} from './sequencing/pointsequencer.js';
import {default as IntervalModeSequencer} from './sequencing/intervalsequencer.js';
export function Sequencer(axis, toA, toB) {
    if (toB === undefined) {
        return new PointModeSequencer(axis, toA);
    } else {
        return new IntervalModeSequencer(axis, toA, toB);
    }
};

// ui
export {default as DatasetViewer} from './ui/datasetviewer.js';
export {default as TimingProgress} from './ui/timingprogress.js';

export const version = "v3.0";
