// src/app/components/shared/loading/loading.component.ts
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-loading',
  template: `
    <div class="loading-container" [class.overlay]="overlay">
      <div class="loading-content">
        <mat-spinner [diameter]="size" [color]="color"></mat-spinner>
        <p *ngIf="message" class="loading-message">{{ message }}</p>
      </div>
    </div>
  `,
  styles: [`
    .loading-container {
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 40px 20px;
      
      &.overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(255, 255, 255, 0.8);
        z-index: 9999;
        backdrop-filter: blur(2px);
      }
    }
    
    .loading-content {
      text-align: center;
      
      .loading-message {
        margin-top: 16px;
        color: #666;
        font-size: 14px;
      }
    }
  `]
})
export class LoadingComponent {
  @Input() message: string = '';
  @Input() size: number = 50;
  @Input() color: 'primary' | 'accent' | 'warn' = 'primary';
  @Input() overlay: boolean = false;
}