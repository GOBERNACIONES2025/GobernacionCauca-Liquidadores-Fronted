import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-page-header',
  imports: [],
  templateUrl: './page-header.html',
  styleUrl: './page-header.css'
})
export class PageHeaderComponent {
  @Input() breadcrumbs: string[] = [];
  @Input() title: string = '';
  @Input() tags: { text: string, type: string }[] = [];
  @Input() counts: { total?: number, active?: number, inactive?: number } | null = null;
}
