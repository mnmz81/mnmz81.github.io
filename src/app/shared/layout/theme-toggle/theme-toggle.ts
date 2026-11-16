import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Button, Icon } from '@mushilu-san/ui/primitives';
import { ThemeService } from '../../../core/theme.service';

@Component({
  selector: 'app-theme-toggle',
  imports: [Button, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button muiButton variant="ghost" size="sm" type="button" class="theme-toggle" (click)="theme.toggle()" [attr.aria-label]="label()" [attr.title]="label()">
      <mui-icon [name]="theme.theme() === 'dark' ? 'sun' : 'moon'" />
    </button>
  `,
})
export class ThemeToggle {
  protected readonly theme = inject(ThemeService);
  protected readonly label = computed(() => (this.theme.theme() === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'));
}
