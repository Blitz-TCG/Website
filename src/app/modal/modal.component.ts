import { Component, ElementRef, HostListener, OnInit, ViewChild } from '@angular/core';
import { ModalService } from './modal.service';

@Component({
  selector: 'app-modal',
  templateUrl: './modal.component.html',
  styleUrls: ['./modal.component.scss']
})
export class ModalComponent implements OnInit {

  selectedCard: any = null;
  displayStyle = "none";
  @ViewChild('modalContainer') modalContainer!: ElementRef;

  constructor(private modalService: ModalService, private elementRef: ElementRef) { }
  
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

  onClickOutsideModal(event: MouseEvent): void {
    if (this.selectedCard) {
      const targetElement = event.target as HTMLElement;
      const modalContainerElement = this.elementRef.nativeElement;
      const modalElement = modalContainerElement.querySelector('#cardModal');
      console.log(modalElement)
      console.log(modalElement.contains(targetElement))
      if (modalElement && !modalElement.contains(targetElement)) {
        this.closeModal();
      }
    }
  }

  closeModal() {
    this.modalService.close();
    this.displayStyle = "none";
  }


  getLevel(level: number) {
    if (level >= 2 && level <= 4)
      return "Lower";
    else if (level >= 5 && level <= 8)
      return "Mid";
    else if (level >= 9 && level <= 10)
      return "Upper";
    else
      return "Starter";
  }
}
