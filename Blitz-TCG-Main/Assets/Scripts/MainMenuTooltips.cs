using UnityEngine;
using UnityEngine.EventSystems;

public class MainMenuTooltips : MonoBehaviour, IPointerEnterHandler, IPointerExitHandler
{
    public static MainMenuTooltips instance;

    [Header("Button References")]
    [SerializeField]
    private GameObject Tooltip;

    //Detect if the Cursor starts to pass over the GameObject
    public void OnPointerEnter(PointerEventData pointerEventData)
    {
        //Debug.Log("Cursor Entering " + name + " GameObject");
        if (!MainMenuUIManager.instance.settingsHelpTextDisabled.activeSelf)
        {
            if (name == "Skirmish")
            {
                Tooltip.SetActive(true);
            }
            else if (name == "Deck Builder")
            {
                Tooltip.SetActive(true);
            }
            else if (name == "Exit")
            {
                Tooltip.SetActive(true);
            }
        }
    }

    //Detect when Cursor leaves the GameObject
    public void OnPointerExit(PointerEventData pointerEventData)
    {
        //Debug.Log("Cursor Exiting " + name + " GameObject");
        if (!MainMenuUIManager.instance.settingsHelpTextDisabled.activeSelf)
        {
            if (name == "Skirmish")
            {
                Tooltip.SetActive(false);
            }
            else if (name == "Deck Builder")
            {
                Tooltip.SetActive(false);
            }
            else if (name == "Exit")
            {
                Tooltip.SetActive(false);
            }
        }
    }
}
