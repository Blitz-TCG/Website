import { Component, OnInit, ViewChild, Renderer2, ElementRef, HostListener } from '@angular/core';
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
    constructor(public afs: AngularFirestore, private renderer: Renderer2) {
        this.booksData$ = afs
            .collection('stories')
            .valueChanges()
            .pipe(
                switchMap(async (results) => {
                    const promises = results
                        .sort((a: any, b: any) => a.position - b.position)
                        .map(async (item: any) => {
                            return item;
                        });
                    const data = await Promise.all(promises);
                    return data;
                })
            )
    }

    config: SwiperOptions = {
        spaceBetween: 8,
        navigation: false,
        pagination: { clickable: true },
        scrollbar: { draggable: true },
        breakpoints: {
            500: {
                slidesPerView: 1,
            },
            768: {
                slidesPerView: 2,
            },
            992: {
                slidesPerView: 3
            },
            1200: {
                slidesPerView: 4
            },
            1400: {
                slidesPerView: 5
            }
        }
    };

    ngOnInit(): void {
        const title = document.querySelector('.cover-title')
        if (title) {
            //@ts-ignore
            var width = title?.offsetWidth;
            this.renderer.setStyle(title, 'font-size', (width / 5 | 0) + 'px');
        }
    }

    onSlideChange() {
        this.showMobileBook = false;
    }
    selectStory(book: any) {
        if (!book.show) return;

        let coverOpen = document.querySelector('.book-opening');
        if (coverOpen) {
            this.renderer.setStyle(coverOpen, 'animation', 'none');

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
            this.mobilePages = [...this.mobilePages, p.left, p.right];
        });
        if (this.mobilePages.length > 0) {
            this.showMobileBook = true;
        }
    }
    openCover(item: number) {
        let coverOpen = document.querySelector('.book-opening'), closeSound = document.getElementById('close-sound');
        if (coverOpen && closeSound) {
            //@ts-ignore
            closeSound?.currentTime = 0;
            //@ts-ignore
            closeSound?.play();
            this.selectedCover = null;
            this.selectedCoverContainer = item;
            this.renderer.setStyle(coverOpen, 'animation', 'flip-next-gif steps(40) 1s both');
            setTimeout(() => {
                this.selectedPages = 0;
            }, 1000);
        }
    }

    flipNext() {
        let pages = document.querySelectorAll(".page-content"), flip = document.getElementById('flip'),
            flipSound = document.getElementById('flip-sound');
        this.booksData$.subscribe((data) => {
            if (this.selectedCoverContainer && data.length > 0) {
                const pagesLength = data[this.selectedCoverContainer - 1]?.pages?.length;
                if (flip && flipSound && pagesLength > 0) {
                    if (this.selectedPages < pagesLength - 1) {
                        this.renderer.setStyle(flip, 'animation', 'flip-next-gif steps(47) 1s both');
                        // pages.forEach(element => {
                        //     this.renderer.setStyle(element, 'animation', '');
                        // });
                        setTimeout(() => {
                            this.renderer.setStyle(flip, 'animation', '');
                            // pages.forEach(element => {
                            //     this.renderer.setStyle(element, 'animation', 'text-gif 1s ease-in-out');
                            // });
                        }, 1000);
                        //@ts-ignore
                        flipSound?.currentTime = 0;
                        //@ts-ignore
                        flipSound?.play();
                        this.selectedPages += 1;
                    }
                }
            }
        })
    }

    flipPrev() {
        let flip = document.getElementById('flip'),
            flipSound = document.getElementById('flip-sound');
        this.booksData$.subscribe((data) => {
            if (this.selectedCoverContainer && data.length > 0) {
                const pagesLength = data[this.selectedCoverContainer - 1]?.pages?.length;
                if (flip && flipSound && pagesLength > 0) {
                    if (this.selectedPages > 0) {
                        this.renderer.setStyle(flip, 'animation', 'flip-prev-gif steps(47) 1s both');
                        setTimeout(() => {
                            this.renderer.setStyle(flip, 'animation', '');
                        }, 1000);
                        //@ts-ignore
                        flipSound?.currentTime = 0;
                        //@ts-ignore
                        flipSound?.play();
                        this.selectedPages -= 1;
                    }
                }
            }
        })
    }
    pageMobileNext() {
        let flipSound = document.getElementById('flip-sound');
        if (this.selectedMobilePage < this.mobilePages.length - 1) {
            if (flipSound) {
                //@ts-ignore
                flipSound?.currentTime = 0;
                //@ts-ignore
                flipSound?.play();
            }
            this.selectedMobilePage = this.selectedMobilePage + 1;
        }
    }
    pageMobilePrev() {
        let flipSound = document.getElementById('flip-sound');

        if (this.selectedMobilePage > 0) {
            if (flipSound) {
                //@ts-ignore
                flipSound?.currentTime = 0;
                //@ts-ignore
                flipSound?.play();
            }
            this.selectedMobilePage--;
        }
    }

    getStyle(imageFilename: string): object {
        return {
            'background-image': `url('/assets/bottom_${imageFilename}')`,
        };
    }

    @HostListener('window:scroll', ['$event'])
    handleScroll() {
        const windowScroll = window.pageYOffset;
        if (windowScroll > 0) {
            this.sticky = true;
        } else {
            this.sticky = false;
        }
    }
}
