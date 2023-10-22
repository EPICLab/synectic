import {versions} from '#preload';

const ElectronVersion = () => {
  return (
    <table id="process-versions">
      <tbody>
        {Object.entries(versions).map(([lib, version]) => (
          <tr key={lib}>
            <td>{lib}</td>
            <td>{version}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default ElectronVersion;
