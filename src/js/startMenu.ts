import{Team, svgMarkup} from "./consts"
import{DomTools} from "./domTools"

export class StartMenu {

    parentElem : HTMLElement
    circleBtn !: HTMLElement
    crossBtn !: HTMLElement
    menu !: HTMLElement
    callback !: Function | null
    private hidden !: boolean
    
    constructor(parentElem : HTMLElement){
        this.parentElem = parentElem
        this.hidden = true
        this.show()
    }

    onGameStart(callback : Function) : void {
        this.callback = callback
    }

    private buttonClicked(teamClicked : Team){
        this.close()
        if(this.callback)
            this.callback(teamClicked)
    }

    close() : void {
        if(this.hidden)
            return
        //unblurring other nodes
        let otherElems = DomTools.querySelectorAll(this.parentElem, ":scope > *:not(.menu)")
        DomTools.removeClass(otherElems, "behind")

        DomTools.recreateNode(this.circleBtn, false)
        DomTools.recreateNode(this.crossBtn, false)
        
        this.parentElem.removeChild(this.menu)

        this.hidden = true
    }

    show() : void {
        if(!this.hidden)
            return

        let menuFragment = document.createRange().createContextualFragment(
            `
            <div class="menu popup ui-block" >
                <p>Play as...</p>
                <div class="team-selection"><button class="cross-btn">${svgMarkup.cross}</button>
                <button class="circle-btn">${svgMarkup.circle}</button></div>                
            </div>
        `
        ) as Node

        this.parentElem.appendChild(menuFragment)
        this.menu = DomTools.querySelector(this.parentElem, ".menu")

        this.circleBtn = DomTools.querySelector(this.menu, ".circle-btn")
        this.crossBtn = DomTools.querySelector(this.menu, ".cross-btn")

        this.circleBtn.addEventListener("click", () => {
            this.buttonClicked(Team.Circle)
        })
        this.crossBtn.addEventListener("click", () => {
            this.buttonClicked(Team.Cross)
        })

        //blurring all other elements sharing the same parent that are behind this one
        let otherElems = DomTools.querySelectorAll(this.parentElem, ":scope > *:not(.menu)")
        DomTools.addClass(otherElems, "behind")

        this.hidden = false
    }
}