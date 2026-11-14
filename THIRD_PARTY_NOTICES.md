# Third-party notices

The root [MIT license](LICENSE) applies to SafeSpace's original work. The components below retain their own copyright notices and licenses. This inventory was checked against the installed packages and locked versions on 14 November 2026; it covers the direct runtime components, current fonts and the checked-in Gradle wrapper.

## Application components

| Component                     | Checked version | License                                       | Retained terms and source                                                                                                                                    |
| ----------------------------- | --------------- | --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| React and React DOM           | 18.3.1          | MIT                                           | [Facebook notice](docs/licenses/React-MIT.txt) · [upstream](https://github.com/facebook/react)                                                               |
| TensorFlow.js                 | 4.22.0          | Apache-2.0                                    | [License text](docs/licenses/Apache-2.0.txt) · [upstream](https://github.com/tensorflow/tfjs)                                                                |
| COCO-SSD JavaScript package   | 2.2.3           | Apache-2.0                                    | [License text](docs/licenses/Apache-2.0.txt) · [upstream](https://github.com/tensorflow/tfjs-models/tree/master/coco-ssd)                                    |
| Capacitor core and Android    | 8.6.0           | MIT                                           | [Drifty Co. notice](docs/licenses/Capacitor-MIT.txt) · [upstream](https://github.com/ionic-team/capacitor)                                                   |
| Capacitor Bluetooth LE plugin | 8.3.0           | MIT                                           | [Plugin notice](docs/licenses/Bluetooth-LE-MIT.txt) · [upstream](https://github.com/capacitor-community/bluetooth-le)                                        |
| Lucide React icons            | 0.468.0         | ISC, with attribution to Feather MIT portions | [Lucide attribution](docs/licenses/Lucide-ISC.txt) · [Feather MIT terms](docs/licenses/Feather-MIT.txt) · [upstream](https://github.com/lucide-icons/lucide) |

TensorFlow source headers identify Google LLC as copyright holder; those upstream headers remain in the packages. The Apache license file is the full upstream TensorFlow.js text. The notices copied from installed MIT/ISC packages preserve their original copyright lines.

## Fonts

The existing application loads DM Sans and Manrope through Google Fonts. Font binaries are not bundled in this repository. Their rendered appearance is visible in the app screenshots.

| Font    | License                   | Retained terms                                                                                                                                |
| ------- | ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| DM Sans | SIL Open Font License 1.1 | [DM Sans Project Authors and OFL text](docs/licenses/DM-Sans-OFL-1.1.txt) · [upstream](https://github.com/google/fonts/tree/main/ofl/dmsans)  |
| Manrope | SIL Open Font License 1.1 | [Manrope Project Authors and OFL text](docs/licenses/Manrope-OFL-1.1.txt) · [upstream](https://github.com/google/fonts/tree/main/ofl/manrope) |

## Native and build tooling

The checked-in Gradle wrapper JAR contains an Apache-2.0 license, retained in [Gradle-Wrapper-LICENSE.txt](docs/licenses/Gradle-Wrapper-LICENSE.txt). Its embedded license and the generated Gradle script headers are unchanged. [Gradle source](https://github.com/gradle/gradle).

Vite, the Capacitor CLI, test tools and their transitive dependencies retain the terms delivered in their packages. Exact dependency versions and declared licenses are in the package lockfiles. This direct-component inventory is not an exhaustive notice bundle for a compiled web distribution or APK; redistribution must retain the notices for the dependencies actually included in that artifact.

## Model assets and evaluation data

The COCO-SSD **JavaScript package's** Apache license does not establish the provenance or redistribution terms of every separately downloaded checkpoint. SafeSpace does not include the model weight files in Git. Before redistributing or self-hosting weights, check their original checkpoint terms and preserve applicable notices. The existing upstream URL remains unchanged.

COCO annotations, image metadata and images keep their source terms. Images have individual license records; the [benchmark manifest](docs/quality/benchmark-manifest.json) retains their IDs, source URLs and license IDs. Original images and annotation archives are not redistributed here. A manifest or derived prediction file does not transfer rights to the source images or model weights. See [benchmark asset notes](docs/quality/benchmark.md#asset-hosting-and-licenses).

## SafeSpace artwork and screenshots

The repository banners and workflow illustration are original SafeSpace artwork covered by MIT. Screenshots show SafeSpace's original interface alongside the dependency-provided icons/fonts listed above; those third-party elements retain their own terms. [Capture provenance](docs/media/README.md) describes the actual UI and synthetic sensing guards. The reference projects supplied presentation inspiration, not copied assets or code.
