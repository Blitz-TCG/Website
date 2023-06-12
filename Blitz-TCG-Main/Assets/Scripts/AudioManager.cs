using UnityEngine;
using UnityEngine.Audio;

public class AudioManager : MonoBehaviour
{
    public AudioMixer mixer;

    void Start()
    {
        if (PlayerPrefs.HasKey("MasterVolume"))
        {
            mixer.SetFloat("MasterVol", PlayerPrefs.GetFloat("MasterVolume"));
        }
        else
        {
            mixer.SetFloat("MasterVol", -80 + 13 * (100 / 13));
            PlayerPrefs.SetFloat("MasterVolume", -80 + 13 * (100 / 13));
            PlayerPrefs.SetFloat("MasterVolumeTier", 13);
            PlayerPrefs.Save();
        }

        if (PlayerPrefs.HasKey("MusicVolume"))
        {
            mixer.SetFloat("MusicVol", PlayerPrefs.GetFloat("MusicVolume"));
        }
        else
        {
            mixer.SetFloat("MusicVol", -80 + 7 * (100 / 13));
            PlayerPrefs.SetFloat("MusicVolume", -80 + 7 * (100 / 13));
            PlayerPrefs.SetFloat("MusicVolumeTier", 7);
            PlayerPrefs.Save();
        }

        if (PlayerPrefs.HasKey("EffectsVolume"))
        {
            mixer.SetFloat("EffectsVol", PlayerPrefs.GetFloat("EffectsVolume"));
        }
        else
        {
            mixer.SetFloat("EffectsVol", -80 + 7 * (100 / 13));
            PlayerPrefs.SetFloat("EffectsVolume", -80 + 7 * (100 / 13));
            PlayerPrefs.SetFloat("EffectsVolumeTier", 7);
            PlayerPrefs.Save();
        }
    }


}
