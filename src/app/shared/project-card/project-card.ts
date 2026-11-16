import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Button, Chip } from '@mushilu-san/ui/primitives';
import type { Project } from '../../core/content.models';

@Component({
  selector: 'app-project-card',
  imports: [Button, Chip],
  templateUrl: './project-card.html',
  styleUrl: './project-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectCard {
  readonly project = input.required<Project>();
}
