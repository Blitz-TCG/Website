using UnityEngine;
using System.Runtime.InteropServices;
using System;

public class LoginMenuExitMin : MonoBehaviour
{
    public static LoginMenuExitMin instance;

    [Header("References")]
    [SerializeField]
    private GameObject exitUI;
    [SerializeField]
    private GameObject minimizeUI;

    //Miminize Window
    [DllImport("user32.dll")]
    private static extern bool ShowWindow(IntPtr hwnd, int nCmdShow);
    [DllImport("user32.dll")]
    private static extern IntPtr GetActiveWindow();

    private void Awake()
    {
        if (instance == null)
        {
            instance = this;
        }
        else if (instance != this)
        {
            Destroy(instance.gameObject);
        }

    }

    public void ExitButton()
    {
        Application.Quit();
        Debug.Log("Closed");
        //UnityEditor.EditorApplication.isPlaying = false; //remove when building game - will cause game error
    }

    public void MinimizeButton()
    {
        ShowWindow(GetActiveWindow(), 2);
    }

}
