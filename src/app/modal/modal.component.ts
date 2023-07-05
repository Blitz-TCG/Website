import { Component, HostListener, OnInit } from '@angular/core';
import { ModalService } from './modal.service';

@Component({
  selector: 'app-modal',
  templateUrl: './modal.component.html',
  styleUrls: ['./modal.component.scss']
})
export class ModalComponent implements OnInit {

  selectedCard: any = null;
  displayStyle = "none";

  constructor(private modalService: ModalService) { }

  ngOnInit() {
    this.modalService.modalData$.subscribe(data => {
      this.selectedCard = data;
      this.displayStyle = "block";

      // Perform any additional logic with the data
    });
  }
  @HostListener('document:keydown.escape')
  onEscapeKeyDown() {
    this.closeModal();
  }

  closeModal() {
    this.modalService.close();
    this.displayStyle = "none";

  }

}
