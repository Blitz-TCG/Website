import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class ModalService {
    private modalDataSubject = new Subject<any>();
    modalData$ = this.modalDataSubject.asObservable();
    private closeModalSubject = new Subject<void>();
    closeModal$ = this.closeModalSubject.asObservable();

    openModal(data: any) {
        this.modalDataSubject.next(data);
    }

    close() {
        this.closeModalSubject.next();
    }
}
