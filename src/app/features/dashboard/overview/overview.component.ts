import { Component, OnInit } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
    selector: 'overview-component',
    imports: [MatIconModule],
    templateUrl: './overview.component.html',
    styleUrl: './overview.component.scss',
})

export class OverviewComponent implements OnInit {
    constructor() { }

    ngOnInit() { }
}