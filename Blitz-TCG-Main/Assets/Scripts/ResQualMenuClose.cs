using UnityEngine;
using UnityEngine.EventSystems;

public class ResQualMenuClose : MonoBehaviour, IPointerClickHandler
{

    public static ResQualMenuClose instance;

    [Header("Button References")]
     [SerializeField]
     private GameObject settingsUI;

    //Detect if anywhere on the Settings background object is clicked
     public void OnPointerClick(PointerEventData pointerEventData)
     {
        MainMenuUIManager.instance.settingsQualityClosed.SetActive(true);
        MainMenuUIManager.instance.settingsQualityOpen.SetActive(false);
        MainMenuUIManager.instance.settingsQualityGrouper.SetActive(false);
        MainMenuUIManager.instance.settingsResolutionClosed.SetActive(true);
        MainMenuUIManager.instance.settingsResolutionOpen.SetActive(false);
        MainMenuUIManager.instance.settingsResolutionGrouper.SetActive(false);
    }
}
