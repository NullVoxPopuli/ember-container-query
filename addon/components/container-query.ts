import { action } from '@ember/object';
import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { debounce } from '@ember/runloop';
import type {
  Features,
  QueryResults,
} from 'ember-container-query/modifiers/container-query';

interface ContainerQueryComponentArgs {
  dataAttributePrefix?: string;
  debounce?: number;
  features?: Features;
  tagName?: string;
}

export default class ContainerQueryComponent extends Component<ContainerQueryComponentArgs> {
  @tracked queryResults = {} as QueryResults;
  @tracked aspectRatio?: number;
  @tracked height?: number;
  @tracked width?: number;

  get features(): Features {
    return this.args.features ?? {};
  }

  get dataAttributePrefix(): string {
    return this.args.dataAttributePrefix ?? 'container-query';
  }

  get debounce(): number {
    return this.args.debounce ?? 0;
  }

  // The dynamic tag is restricted to be immutable
  tagName = this.args.tagName ?? 'div';

  @action onResize(resizeObserverEntry: ResizeObserverEntry): void {
    const element = resizeObserverEntry.target;

    if (this.debounce > 0) {
      debounce(this, this.queryContainer, element, this.debounce);
      return;
    }

    this.queryContainer(element);
  }

  @action queryContainer(element: Element): void {
    this.setDataAttributes(element);
  }

  setDataAttributes(element: Element): void {
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
