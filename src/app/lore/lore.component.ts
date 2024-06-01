import { isPlatformBrowser } from '@angular/common';
import { Component, OnInit, ViewChild, Renderer2, ElementRef, HostListener, Inject, PLATFORM_ID } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Observable, switchMap } from 'rxjs';
import SwiperCore, { SwiperOptions, Pagination, Scrollbar } from 'swiper';
import { SwiperComponent } from 'swiper/angular';

SwiperCore.use([Pagination]);

@Component({
    selector: 'app-lore',
    templateUrl: './lore.component.html',
    styleUrls: ['./lore.component.scss'],
})
export class LoreComponent implements OnInit {
    @ViewChild('stickySlider', { static: false }) menuElement?: ElementRef;
    sticky: boolean = false;
    booksData$: Observable<any>;
    selectedCoverContainer: number | null = null;
    selectedCover: number | null = null;
    selectedPages: any = null;
    showMobileBook: boolean = false;
    mobilePages: any = [];
    selectedMobilePage: number = 0;
    @ViewChild('swiper', { static: false }) swiper?: SwiperComponent;

    constructor(public afs: AngularFirestore, private renderer: Renderer2, @Inject(PLATFORM_ID) private platformId: any) {
        this.booksData$ = afs.collection('stories')
            .valueChanges()
            .pipe(
                switchMap(async (results) => {
                    const promises = results
                        .sort((a: any, b: any) => a.position - b.position)
                        .map(async (item: any) => item);
                    const data = await Promise.all(promises);
                    return data;
                })
            );
    }

    config: SwiperOptions = {
        spaceBetween: 8,
        navigation: false,
        pagination: { clickable: true },
        scrollbar: { draggable: true },
        breakpoints: {
            500: { slidesPerView: 1 },
            768: { slidesPerView: 2 },
            992: { slidesPerView: 3 },
            1200: { slidesPerView: 4 },
            1400: { slidesPerView: 5 }
        }
    };

    ngOnInit(): void {
        if (isPlatformBrowser(this.platformId)) {
            const title = document.querySelector<HTMLElement>('.cover-title');
            if (title) {
                const width = title.offsetWidth;
                this.renderer.setStyle(title, 'font-size', `${Math.floor(width / 5)}px`);
            }
        }
    }

    onSlideChange() {
        this.showMobileBook = false;
    }

    selectStory(book: any) {
        if (!book.show) return;
        if (isPlatformBrowser(this.platformId)) {
            const coverOpen = document.querySelector<HTMLElement>('.book-opening');
            if (coverOpen) {
                this.renderer.setStyle(coverOpen, 'animation', 'none');
            }
        }
        this.selectedPages = null;
        this.selectedCoverContainer = null;
        this.selectedCover = book.position;
    }

    selectMobileStory(book: any) {
        if (!book.show) return;
        this.mobilePages = [];
        this.selectedMobilePage = 0;
        book?.pages?.forEach((p: any) => {
            this.mobilePages.push(p.left, p.right);
        });
        if (this.mobilePages.length > 0) {
            this.showMobileBook = true;
        }
    }

    openCover(item: number) {
        if (isPlatformBrowser(this.platformId)) {
            const coverOpen = document.querySelector<HTMLElement>('.book-opening');
            const closeSound = document.getElementById('close-sound') as HTMLAudioElement;
            if (coverOpen && closeSound) {
                closeSound.currentTime = 0;
                closeSound.play();
                this.selectedCover = null;
                this.selectedCoverContainer = item;
                this.renderer.setStyle(coverOpen, 'animation', 'flip-next-gif steps(40) 1s both');
                setTimeout(() => {
                    this.selectedPages = 0;
                }, 1000);
            }
        }
    }

    flipNext() {
        if (isPlatformBrowser(this.platformId)) {
            const flip = document.getElementById('flip') as HTMLElement;
            const flipSound = document.getElementById('flip-sound') as HTMLAudioElement;
            this.booksData$.subscribe((data) => {
                if (this.selectedCoverContainer !== null && data.length > 0) {
                    const pagesLength = data[this.selectedCoverContainer - 1]?.pages?.length;
                    if (flip && flipSound && pagesLength > 0) {
                        if (this.selectedPages < pagesLength - 1) {
                            this.renderer.setStyle(flip, 'animation', 'flip-next-gif steps(47) 1s both');
                            setTimeout(() => {
                                this.renderer.setStyle(flip, 'animation', '');
                            }, 1000);
                            flipSound.currentTime = 0;
                            flipSound.play();
                            this.selectedPages += 1;
                        }
                    }
                }
            });
        }
    }

    flipPrev() {
        if (isPlatformBrowser(this.platformId)) {
            const flip = document.getElementById('flip') as HTMLElement;
            const flipSound = document.getElementById('flip-sound') as HTMLAudioElement;
            this.booksData$.subscribe((data) => {
                if (this.selectedCoverContainer !== null && data.length > 0) {
                    const pagesLength = data[this.selectedCoverContainer - 1]?.pages?.length;
                    if (flip && flipSound && pagesLength > 0) {
                        if (this.selectedPages > 0) {
                            this.renderer.setStyle(flip, 'animation', 'flip-prev-gif steps(47) 1s both');
                            setTimeout(() => {
                                this.renderer.setStyle(flip, 'animation', '');
                            }, 1000);
                            flipSound.currentTime = 0;
                            flipSound.play();
                            this.selectedPages -= 1;
                        }
                    }
                }
            });
        }
    }

    pageMobileNext() {
        if (isPlatformBrowser(this.platformId)) {
            const flipSound = document.getElementById('flip-sound') as HTMLAudioElement;
            if (this.selectedMobilePage < this.mobilePages.length - 1) {
                if (flipSound) {
                    flipSound.currentTime = 0;
                    flipSound.play();
                }
                this.selectedMobilePage += 1;
            }
        }
    }

    pageMobilePrev() {
        if (isPlatformBrowser(this.platformId)) {
            const flipSound = document.getElementById('flip-sound') as HTMLAudioElement;
            if (this.selectedMobilePage > 0) {
                if (flipSound) {
                    flipSound.currentTime = 0;
                    flipSound.play();
                }
                this.selectedMobilePage -= 1;
            }
        }
    }

    getStyle(imageFilename: string): object {
        return { 'background-image': `url('/assets/bottom_${imageFilename}')` };
    }

    @HostListener('window:scroll', ['$event'])
    handleScroll() {
        if (isPlatformBrowser(this.platformId)) {
            const windowScroll = window.pageYOffset;
            this.sticky = windowScroll > 0;
        }
    }
}
