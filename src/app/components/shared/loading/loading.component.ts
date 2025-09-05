// src/app/components/shared/loading/loading.component.ts
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-loading',
  templateUrl: './loading.component.html',
  styleUrls: ['./loading.component.scss']
})
export class LoadingComponent {
  @Input() message: string = '';
  @Input() size: number = 50;
  @Input() color: 'primary' | 'accent' | 'warn' = 'primary';
  @Input() overlay: boolean = false;

  constructor() {}
}