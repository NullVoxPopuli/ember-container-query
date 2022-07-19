import { registerDestructor } from '@ember/destroyable';
import { action } from '@ember/object';
import { debounce as _debounce } from '@ember/runloop';
import { inject as service } from '@ember/service';
import Modifier, { ArgsFor } from 'ember-modifier';

export type Metadata = {
  dimension: 'aspectRatio' | 'height' | 'width';
  max: number;
  min: number;
};

export type Features = {
  [featureName: string]: Metadata;
};

export type Dimensions = {
  aspectRatio: number;
  height: number;
  width: number;
};

export type QueryResults = {
  [featureName: string]: boolean;
};

interface ContainerQueryModifierSignature {
  Args: {
    Named: {
      dataAttributePrefix?: string;
      debounce?: number;
      features?: Features;
      onQuery?: ({
        dimensions,
        queryResults,
      }: {
        dimensions: Dimensions;
        queryResults: QueryResults;
      }) => void;
    };
    Positional: [];
  };
  Element: Element;
}

export default class ContainerQueryModifier extends Modifier<ContainerQueryModifierSignature> {
  /* eslint-disable-next-line @typescript-eslint/ban-ts-comment */
  /* @ts-ignore */
  @service declare resizeObserver;

  dimensions!: Dimensions;
  queryResults!: QueryResults;
  _element?: Element;

  get dataAttributePrefix(): string {
    return this.args.named.dataAttributePrefix ?? 'container-query';
  }

  get debounce(): number {
    return this.args.named.debounce ?? 0;
  }

  get features(): Features {
    return this.args.named.features ?? {};
  }

  constructor(owner: unknown, args: ArgsFor<ContainerQueryModifierSignature>) {
    super(owner, args);

    registerDestructor(this, () => {
      this.resizeObserver.unobserve(this._element, this.onResize);
    });
  }

  modify(element: Element): void {
    this.registerResizeObserver(element);
    this.queryContainer(element);
  }

  @action private onResize(resizeObserverEntry: ResizeObserverEntry): void {
    const element = resizeObserverEntry.target;

    if (this.debounce > 0) {
      _debounce(this, this.queryContainer, element, this.debounce);
      return;
    }

    this.queryContainer(element);
  }

  private registerResizeObserver(element: Element): void {
    this.resizeObserver.observe(element, this.onResize);
    this.resizeObserver.unobserve(this._element, this.onResize);
    this._element = element;
  }

  private queryContainer(element: Element): void {
    this.measureDimensions(element);
    this.evaluateQueries();
    this.setDataAttributes(element);

    this.args.named.onQuery?.({
      dimensions: this.dimensions,
      queryResults: this.queryResults,
    });
  }

  private measureDimensions(element: Element): void {
    const height = element.clientHeight;
    const width = element.clientWidth;

    this.dimensions = {
      aspectRatio: width / height,
      height,
      width,
    };
  }

  private evaluateQueries(): void {
    const queryResults = {} as QueryResults;

    for (const [featureName, metadata] of Object.entries(this.features)) {
      const { dimension, min, max } = metadata;
      const value = this.dimensions[dimension];

      queryResults[featureName] = min <= value && value < max;
    }

    this.queryResults = queryResults;
  }

  private setDataAttributes(element: Element): void {
    const prefix = this.dataAttributePrefix;

    for (const [featureName, meetsFeature] of Object.entries(
      this.queryResults
    )) {
      let attributeName;

      if (prefix) {
        attributeName = `data-${prefix}-${featureName}`;
      } else {
        attributeName = `data-${featureName}`;
      }

      if (meetsFeature) {
        element.setAttribute(attributeName, '');
      } else {
        element.removeAttribute(attributeName);
      }
    }
  }
}